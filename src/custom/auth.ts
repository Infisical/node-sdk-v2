import { InfisicalSDK } from "..";
import { AuthApi } from "../api/endpoints/auth";
import { UniversalAuthLoginRequest } from "../api/types";
import { MACHINE_IDENTITY_ID_ENV_NAME } from "./constants";
import { InfisicalSDKError, newInfisicalError } from "./errors";
import { getAwsRegion, performAwsIamLogin } from "./util";

type AuthenticatorFunction = (accessToken: string) => InfisicalSDK;

type AwsAuthLoginOptions = {
  identityId?: string;
};

export const renewToken = async (apiClient: AuthApi, token?: string) => {
  try {
    if (!token) {
      throw new InfisicalSDKError(
        "Unable to renew access token, no access token set."
      );
    }

    const res = await apiClient.renewToken({ accessToken: token });
    return res;
  } catch (err) {
    throw newInfisicalError(err);
  }
};

export default class AuthClient {
  #sdkAuthenticator: AuthenticatorFunction;
  #apiClient: AuthApi;
  #accessToken?: string;

  constructor(
    authenticator: AuthenticatorFunction,
    apiInstance: AuthApi,
    accessToken?: string
  ) {
    this.#sdkAuthenticator = authenticator;
    this.#apiClient = apiInstance;
    this.#accessToken = accessToken;
  }

  awsIamAuth = {
    login: async (options?: AwsAuthLoginOptions) => {
      try {
        const identityId =
          options?.identityId || process.env[MACHINE_IDENTITY_ID_ENV_NAME];
        if (!identityId) {
          throw new InfisicalSDKError(
            "Identity ID is required for AWS IAM authentication"
          );
        }

        const iamRequest = await performAwsIamLogin(await getAwsRegion());
        const res = await this.#apiClient.awsIamAuthLogin({
          iamHttpRequestMethod: iamRequest.iamHttpRequestMethod,
          iamRequestBody: Buffer.from(iamRequest.iamRequestBody).toString(
            "base64"
          ),
          iamRequestHeaders: Buffer.from(
            JSON.stringify(iamRequest.iamRequestHeaders)
          ).toString("base64"),
          identityId,
        });

        return this.#sdkAuthenticator(res.accessToken);
      } catch (err) {
        throw newInfisicalError(err);
      }
    },
    renew: async () => {
      try {
        const refreshedToken = await renewToken(
          this.#apiClient,
          this.#accessToken
        );
        return this.#sdkAuthenticator(refreshedToken.accessToken);
      } catch (err) {
        throw newInfisicalError(err);
      }
    },
  };

  universalAuth = {
    login: async (options: UniversalAuthLoginRequest) => {
      try {
        const res = await this.#apiClient.universalAuthLogin(options);
        return this.#sdkAuthenticator(res.accessToken);
      } catch (err) {
        throw newInfisicalError(err);
      }
    },
    renew: async () => {
      try {
        const refreshedToken = await renewToken(
          this.#apiClient,
          this.#accessToken
        );
        return this.#sdkAuthenticator(refreshedToken.accessToken);
      } catch (err) {
        throw newInfisicalError(err);
      }
    },
  };

  accessToken = (token: string) => {
    return this.#sdkAuthenticator(token);
  };
}
