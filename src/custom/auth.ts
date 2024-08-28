import { InfisicalSDK } from "..";
import { ApiV1AuthUniversalAuthLoginPostRequest } from "../api/infisical";
import { DefaultApi as InfisicalApi } from "../api/infisical";

type AuthenticatorFunction = (accessToken: string) => InfisicalSDK;

const getAwsRegion = () => {
	// Implement AWS region retrieval logic here
	// For simplicity, we'll use an environment variable
	const region = process.env.AWS_REGION;
	if (!region) {
		throw new Error("AWS region not set");
	}
	return region;
};

export default class AuthClient {
	sdkAuthenticator: AuthenticatorFunction;
	apiClient: InfisicalApi;

	constructor(authenticator: AuthenticatorFunction) {
		this.sdkAuthenticator = authenticator;
		this.apiClient = new InfisicalApi();
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

import * as crypto from "crypto";
import axios from "axios";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
