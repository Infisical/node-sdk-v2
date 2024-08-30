import { InfisicalSDK } from "..";
import { ApiV1AuthUniversalAuthLoginPostRequest } from "../infisicalapi_client";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";

type AuthenticatorFunction = (accessToken: string) => InfisicalSDK;

export default class AuthClient {
	sdkAuthenticator: AuthenticatorFunction;
	apiClient: InfisicalApi;

	constructor(authenticator: AuthenticatorFunction, apiInstance: InfisicalApi) {
		this.sdkAuthenticator = authenticator;
		this.apiClient = apiInstance;
	}

	universalAuth = {
		login: async (options: ApiV1AuthUniversalAuthLoginPostRequest) => {
			const res = await this.apiClient.apiV1AuthUniversalAuthLoginPost({
				apiV1AuthUniversalAuthLoginPostRequest: options
			});

			return this.sdkAuthenticator(res.data.accessToken);
		}
	};

	accessToken = (token: string) => {
		return this.sdkAuthenticator(token);
	};
}
