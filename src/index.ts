import { Configuration, DefaultApi as InfisicalApi } from "./infisicalapi_client";
import { DefaultApiApiV1DynamicSecretsLeasesPostRequest } from "./infisicalapi_client";
import SecretsClient from "./custom/secrets";
import AuthClient from "./custom/auth";
import { RawAxiosRequestConfig } from "axios";
import DynamicSecretsClient from "./custom/dynamic-secrets";

import * as ApiClient from "./infisicalapi_client";

const buildRestClient = (apiClient: InfisicalApi, requestOptions?: RawAxiosRequestConfig) => {
	return {
		// Add more as we go
		apiV1DynamicSecretsLeasesPost: (options: DefaultApiApiV1DynamicSecretsLeasesPostRequest) =>
			apiClient.apiV1DynamicSecretsLeasesPost(options, requestOptions)
	};
};

// We need to do bind(this) because the authenticate method is a private method, and usually you can't call private methods from outside the class.
type InfisicalSDKOptions = {
	siteUrl?: string;
};

class InfisicalSDK {
	#apiInstance: InfisicalApi;

	#requestOptions: RawAxiosRequestConfig | undefined;
	#secretsClient: SecretsClient;
	#dynamicSecretsClient: DynamicSecretsClient;
	#authClient: AuthClient;
	#basePath: string;

	constructor(options?: InfisicalSDKOptions) {
		this.#basePath = options?.siteUrl || "https://app.infisical.com";

		this.#apiInstance = new InfisicalApi(
			new Configuration({
				basePath: this.#basePath
			})
		);

		this.#authClient = new AuthClient(this.authenticate.bind(this), this.#apiInstance);
		this.#dynamicSecretsClient = new DynamicSecretsClient(this.#apiInstance, this.#requestOptions);
		this.#secretsClient = new SecretsClient(this.#apiInstance, this.#requestOptions);
		this.rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);
	}

	private authenticate(accessToken: string) {
		this.#apiInstance = new InfisicalApi(
			new Configuration({
				basePath: this.#basePath,
				accessToken
			})
		);

		this.#requestOptions = {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		};

		this.rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);
		this.#secretsClient = new SecretsClient(this.#apiInstance, this.#requestOptions);
		this.#dynamicSecretsClient = new DynamicSecretsClient(this.#apiInstance, this.#requestOptions);
		this.#authClient = new AuthClient(this.authenticate.bind(this), this.#apiInstance, accessToken);

		return this;
	}

	secrets = () => this.#secretsClient;
	dynamicSecrets = () => this.#dynamicSecretsClient;
	auth = () => this.#authClient;
	rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);
}

export { InfisicalSDK, ApiClient };
export * from "./custom/schemas";
export type * from "./custom/secrets";
export type * from "./custom/dynamic-secrets";
