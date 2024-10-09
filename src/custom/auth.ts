import { InfisicalSDK } from "..";
import { ApiV1AuthUniversalAuthLoginPostRequest } from "../infisicalapi_client";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import { MACHINE_IDENTITY_ID_ENV_NAME } from "./constants";
import { InfisicalSDKError, newInfisicalError } from "./errors";
import { getAwsRegion, performAwsIamLogin } from "./util";

type AuthenticatorFunction = (accessToken: string) => InfisicalSDK;

type AwsAuthLoginOptions = {
	identityId?: string;
};

export const renewToken = async (apiClient: InfisicalApi, token?: string) => {
	try {
		if (!token) {
			throw new InfisicalSDKError("Unable to renew access token, no access token set. Are you sure you're authenticated?");
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
	#sdkAuthenticator: AuthenticatorFunction;
	#apiClient: InfisicalApi;
	#accessToken?: string;

	constructor(authenticator: AuthenticatorFunction, apiInstance: InfisicalApi, accessToken?: string) {
		this.#sdkAuthenticator = authenticator;
		this.#apiClient = apiInstance;
		this.#accessToken = accessToken;
	}

	awsIamAuth = {
		login: async (options?: AwsAuthLoginOptions) => {
			try {
				const identityId = options?.identityId || process.env[MACHINE_IDENTITY_ID_ENV_NAME];

				if (!identityId) {
					throw new InfisicalSDKError("Identity ID is required for AWS IAM authentication");
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

				return this.#sdkAuthenticator(res.data.accessToken);
			} catch (err) {
				throw newInfisicalError(err);
			}
		},
		renew: async () => {
			try {
				const refreshedToken = await renewToken(this.#apiClient, this.#accessToken);
				return this.#sdkAuthenticator(refreshedToken.accessToken);
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

				return this.#sdkAuthenticator(res.data.accessToken);
			} catch (err) {
				throw newInfisicalError(err);
			}
		},

		renew: async () => {
			try {
				const refreshedToken = await renewToken(this.#apiClient, this.#accessToken);
				return this.#sdkAuthenticator(refreshedToken.accessToken);
			} catch (err) {
				throw newInfisicalError(err);
			}
		}
	};

	accessToken = (token: string) => {
		return this.#sdkAuthenticator(token);
	};
}
