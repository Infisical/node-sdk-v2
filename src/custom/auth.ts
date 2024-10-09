import { InfisicalSDK } from "..";
import { ApiV1AuthUniversalAuthLoginPostRequest } from "../infisicalapi_client";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import { AuthMethod, TAuthCredentials, TTokenDetails } from "../types";
import { MACHINE_IDENTITY_ID_ENV_NAME } from "./constants";
import { InfisicalError, newInfisicalError } from "./errors";
import { getAwsRegion, performAwsIamLogin } from "./util";

type TAuthenticator = {
	authenticate: (tokenDetails: Omit<TTokenDetails, "fetchedTime" | "firstFetchTime">) => Promise<InfisicalSDK>;
	setCredentials: (credentials: TAuthCredentials) => void;
};

type AwsAuthLoginOptions = {
	identityId?: string;
};

export const renewToken = async (apiClient: InfisicalApi, token?: string) => {
	try {
		if (!token) {
			throw new InfisicalError("Unable to renew access token, no access token set. Are you sure you're authenticated?");
		}

		const res = await apiClient.apiV1AuthTokenRenewPost({
			apiV1AuthTokenRenewPostRequest: {
				accessToken: token
			}
		});

		return res.data;
	} catch (err) {
		throw newInfisicalError(err);
	}
};

export default class AuthClient {
	#authenticator: TAuthenticator;
	#apiClient: InfisicalApi;
	#accessToken: string | undefined;
	#credentials: TAuthCredentials | undefined;

	constructor(authenticator: TAuthenticator, apiInstance: InfisicalApi, accessToken?: string) {
		this.#authenticator = authenticator;
		this.#apiClient = apiInstance;
		this.#accessToken = accessToken;
	}

	awsIamAuth = {
		login: async (options?: AwsAuthLoginOptions) => {
			try {
				const identityId = options?.identityId || process.env[MACHINE_IDENTITY_ID_ENV_NAME];

				if (!identityId) {
					throw new InfisicalError("Identity ID is required for AWS IAM authentication");
				}

				const iamRequest = await performAwsIamLogin(await getAwsRegion());

				const res = await this.#apiClient.apiV1AuthAwsAuthLoginPost({
					apiV1AuthAwsAuthLoginPostRequest: {
						iamHttpRequestMethod: iamRequest.iamHttpRequestMethod,
						iamRequestBody: Buffer.from(iamRequest.iamRequestBody).toString("base64"),
						iamRequestHeaders: Buffer.from(JSON.stringify(iamRequest.iamRequestHeaders)).toString("base64"),
						identityId
					}
				});

				this.#authenticator.setCredentials({
					type: AuthMethod.AWSIam,
					credentials: {
						identityId
					}
				});
				return this.#authenticator.authenticate(res.data);
			} catch (err) {
				throw newInfisicalError(err);
			}
		},

		renew: async () => {
			try {
				const refreshedToken = await renewToken(this.#apiClient, this.#accessToken);
				return this.#authenticator.authenticate(refreshedToken);
			} catch (err) {
				throw newInfisicalError(err);
			}
		}
	};

	universalAuth = {
		login: async (options: ApiV1AuthUniversalAuthLoginPostRequest) => {
			try {
				const res = await this.#apiClient.apiV1AuthUniversalAuthLoginPost({
					apiV1AuthUniversalAuthLoginPostRequest: options
				});

				this.#authenticator.setCredentials({
					type: AuthMethod.UniversalAuth,
					credentials: {
						clientId: options.clientId,
						clientSecret: options.clientSecret
					}
				});
				return this.#authenticator.authenticate(res.data);
			} catch (err) {
				throw newInfisicalError(err);
			}
		},

		renew: async () => {
			try {
				const refreshedToken = await renewToken(this.#apiClient, this.#accessToken);
				return this.#authenticator.authenticate(refreshedToken);
			} catch (err) {
				throw newInfisicalError(err);
			}
		}
	};

	accessToken = async (token: string) => {
		try {
			const tokenData = await renewToken(this.#apiClient, token);
			this.#authenticator.setCredentials({
				type: AuthMethod.AccessToken,
				credentials: {
					accessToken: token
				}
			});
			return this.#authenticator.authenticate(tokenData);
		} catch (err) {
			throw newInfisicalError(err);
		}
	};
}
