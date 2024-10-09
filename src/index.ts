import { Configuration, DefaultApi as InfisicalApi } from "./infisicalapi_client";
import { DefaultApiApiV1DynamicSecretsLeasesPostRequest } from "./infisicalapi_client";
import SecretsClient from "./custom/secrets";
import AuthClient, { renewToken } from "./custom/auth";
import { RawAxiosRequestConfig } from "axios";
import DynamicSecretsClient from "./custom/dynamic-secrets";

import * as ApiClient from "./infisicalapi_client";
import {
	AccessTokenCredentials,
	AuthMethod,
	AWSIamCredentials,
	InfisicalSDKOptions,
	TAuthCredentials,
	TTokenDetails,
	UniversalAuthCredentials
} from "./types";
import { InfisicalError, InfisicalRequestError } from "./custom/errors";

const buildRestClient = (apiClient: InfisicalApi, requestOptions?: RawAxiosRequestConfig) => {
	return {
		// Add more as we go
		apiV1DynamicSecretsLeasesPost: (options: DefaultApiApiV1DynamicSecretsLeasesPostRequest) =>
			apiClient.apiV1DynamicSecretsLeasesPost(options, requestOptions)
	};
};

class InfisicalSDK {
	#apiInstance: InfisicalApi;

	sdkOptions: InfisicalSDKOptions;

	#requestOptions: RawAxiosRequestConfig | undefined;
	#secretsClient: SecretsClient;
	#dynamicSecretsClient: DynamicSecretsClient;
	#authClient: AuthClient;
	#tokenDetails?: TTokenDetails;
	#authCredentials?: TAuthCredentials;

	constructor(options?: InfisicalSDKOptions) {
		this.sdkOptions = {
			autoTokenRefresh: options?.autoTokenRefresh ?? true,
			siteUrl: options?.siteUrl || "https://app.infisical.com"
		};

		this.#apiInstance = new InfisicalApi(
			new Configuration({
				basePath: this.sdkOptions.siteUrl
			})
		);

		// We need to do bind(this) because the authenticate method is a private method, and usually you can't call private methods from outside the class.
		this.#authClient = new AuthClient(this.#authenticator, this.#apiInstance, this.#tokenDetails?.accessToken);
		this.#dynamicSecretsClient = new DynamicSecretsClient(this.#apiInstance, this.#requestOptions);
		this.#secretsClient = new SecretsClient(this.#apiInstance, this.#requestOptions);
		this.rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);

		if (this.sdkOptions.autoTokenRefresh) {
			this.handleTokenLifecycle();
		}
	}

	private handleTokenLifecycle = async () => {
		const authMethodMap: Record<AuthMethod, () => Promise<InfisicalSDK>> = {
			[AuthMethod.UniversalAuth]: async () =>
				await this.#authClient.universalAuth.login(this.#authCredentials?.credentials as UniversalAuthCredentials),
			[AuthMethod.AWSIam]: async () => await this.#authClient.awsIamAuth.login(this.#authCredentials?.credentials as AWSIamCredentials),
			[AuthMethod.AccessToken]: async () =>
				await this.#authClient.accessToken((this.#authCredentials?.credentials as AccessTokenCredentials).accessToken)
		};

		while (true) {
			try {
				await new Promise(resolve => setTimeout(resolve, 10_000));
				if (!this.#tokenDetails || !this.#authCredentials) {
					continue;
				}

				const now = new Date();
				const timeSinceFetchInSeconds = (now.getTime() - this.#tokenDetails.fetchedTime.getTime()) / 1_000;
				const firstFetchTimeInSeconds = (now.getTime() - this.#tokenDetails.firstFetchTime.getTime()) / 1_000;

				// If there's less than 15 seconds until the token expires, we reauthenticate early
				if (firstFetchTimeInSeconds >= this.#tokenDetails.accessTokenMaxTTL - 15) {
					await authMethodMap[this.#authCredentials.type]();
					this.#tokenDetails.firstFetchTime = new Date();
					// If there's less than 10 seconds until the token expires, we renew it early
				} else if (timeSinceFetchInSeconds >= this.#tokenDetails.expiresIn - 10) {
					const tokenData = await renewToken(this.#apiInstance, this.#tokenDetails.accessToken);
					await this.#authenticator.authenticate(tokenData);
				}
			} catch (err) {
				console.error("Warning: Failed to refresh token", (err as any)?.message);
			}
		}
	};

	#authenticator = {
		authenticate: async (tokenDetails: Omit<TTokenDetails, "fetchedTime" | "firstFetchTime">) => {
			this.#apiInstance = new InfisicalApi(
				new Configuration({
					basePath: this.sdkOptions.siteUrl,
					accessToken: tokenDetails.accessToken
				})
			);

			this.#tokenDetails = {
				...tokenDetails,
				fetchedTime: new Date(),
				firstFetchTime: this.#tokenDetails?.firstFetchTime || new Date()
			};

			this.#requestOptions = {
				headers: {
					Authorization: `Bearer ${tokenDetails.accessToken}`
				}
			};

			this.rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);
			this.#secretsClient = new SecretsClient(this.#apiInstance, this.#requestOptions);
			this.#dynamicSecretsClient = new DynamicSecretsClient(this.#apiInstance, this.#requestOptions);
			this.#authClient = new AuthClient(this.#authenticator, this.#apiInstance, this.#tokenDetails?.accessToken);

			return this;
		},

		setCredentials: (credentials: TAuthCredentials) => {
			this.#authCredentials = credentials;
		}
	};

	secrets = () => this.#secretsClient;
	dynamicSecrets = () => this.#dynamicSecretsClient;
	auth = () => this.#authClient;
	rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);
}

export { InfisicalSDK, ApiClient, InfisicalError, InfisicalRequestError };
export * from "./custom/schemas";
