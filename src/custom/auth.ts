import { InfisicalSDK } from "..";
import { ApiV1AuthUniversalAuthLoginPostRequest } from "../infisicalapi_client";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import { MACHINE_IDENTITY_ID_ENV_NAME } from "./constants";
import { getAwsRegion, performAwsIamLogin } from "./util";
import AWS from "aws-sdk";

type AuthenticatorFunction = (accessToken: string) => InfisicalSDK;

type AwsAuthLoginOptions = {
	identityId?: string;
};

export default class AuthClient {
	sdkAuthenticator: AuthenticatorFunction;
	apiClient: InfisicalApi;
	baseUrl: string;

	constructor(authenticator: AuthenticatorFunction, apiInstance: InfisicalApi, baseUrl: string) {
		this.sdkAuthenticator = authenticator;
		this.apiClient = apiInstance;
		this.baseUrl = baseUrl;
	}

	awsIamAuth = {
		login: async (options?: AwsAuthLoginOptions) => {
			const identityId = options?.identityId || process.env[MACHINE_IDENTITY_ID_ENV_NAME];

			if (!identityId) {
				throw new Error("Identity ID is required for AWS IAM authentication");
			}

			const iamRequest = await performAwsIamLogin(this.baseUrl, identityId, await getAwsRegion());

			const res = await this.apiClient.apiV1AuthAwsAuthLoginPost({
				apiV1AuthAwsAuthLoginPostRequest: {
					iamHttpRequestMethod: iamRequest.iamHttpRequestMethod,
					iamRequestBody: Buffer.from(iamRequest.iamRequestBody).toString("base64"),
					iamRequestHeaders: Buffer.from(JSON.stringify(iamRequest.iamRequestHeaders)).toString("base64"),
					identityId
				}
			});

			return this.sdkAuthenticator(res.data.accessToken);
		}
	};

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
