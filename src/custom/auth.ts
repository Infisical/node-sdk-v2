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

	awsIam = {
		login: async (identityId: string) => {
			if (!identityId) {
				identityId = process.env.INFISICAL_AWS_IAM_AUTH_IDENTITY_ID_ENV_NAME || "";
			}

			const awsRegion = getAwsRegion();

			const credentials = await fromNodeProviderChain()();

			// Prepare request for signing
			const iamRequestURL = `https://sts.${awsRegion}.amazonaws.com/`;
			const iamRequestBody = "Action=GetCallerIdentity&Version=2011-06-15";

			const currentTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
			const headers = {
				"X-Amz-Date": currentTime,
				Host: `sts.${awsRegion}.amazonaws.com`,
				"Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
				"Content-Length": iamRequestBody.length.toString()
			};

			const signer = new SignatureV4({
				credentials,
				region: awsRegion,
				service: "sts",
				sha256: Sha256
			});

			const signedRequest = await signer.sign({
				method: "POST",
				protocol: "https",
				hostname: `sts.${awsRegion}.amazonaws.com`,
				path: "/",
				headers,
				body: iamRequestBody
			});

			const realHeaders: Record<string, string> = {};
			for (const [key, value] of Object.entries(signedRequest.headers)) {
				if (key.toLowerCase() !== "content-length") {
					realHeaders[key] = Array.isArray(value) ? value[0] : value;
				}
			}

			const jsonStringHeaders = JSON.stringify(realHeaders);

			const request = {
				httpRequestMethod: "POST",
				iamRequestBody: Buffer.from(iamRequestBody).toString("base64"),
				iamRequestHeaders: Buffer.from(jsonStringHeaders).toString("base64"),
				identityId
			};

			const credential = await this.apiClient.apiV1AuthAwsAuthLoginPost({
				apiV1AuthAwsAuthLoginPostRequest: {
					iamHttpRequestMethod: request.httpRequestMethod,
					iamRequestBody: request.iamRequestBody,
					iamRequestHeaders: request.iamRequestHeaders,
					identityId: request.identityId
				}
			});

			return this.sdkAuthenticator(credential.data.accessToken);
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
