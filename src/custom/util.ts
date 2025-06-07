import axios from "axios";
import { AWS_IDENTITY_DOCUMENT_URI, AWS_TOKEN_METADATA_URI } from "./constants";

import { Sha256 } from "@aws-crypto/sha256-js";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";

import { InfisicalSDKError } from "./errors";
import { Secret } from "../api/types";

export const getUniqueSecretsByKey = (secrets: Secret[]) => {
	const secretMap = new Map<string, Secret>();

	for (const secret of secrets) {
		secretMap.set(secret.secretKey, secret);
	}

	return Array.from(secretMap.values());
};

export const getAwsRegion = async () => {
	const region = process.env.AWS_REGION; // Typically found in lambda runtime environment
	if (region) {
		return region;
	}

	try {
		const tokenRes = await axios.put(AWS_TOKEN_METADATA_URI, undefined, {
			headers: {
				"X-aws-ec2-metadata-token-ttl-seconds": "21600"
			},
			timeout: 5_000 // 5 seconds
		});

		const identityResponse = await axios.get<{ region: string }>(AWS_IDENTITY_DOCUMENT_URI, {
			headers: {
				"X-aws-ec2-metadata-token": tokenRes.data,
				Accept: "application/json"
			},
			timeout: 5_000
		});

		return identityResponse.data.region;
	} catch (e) {
		console.error("Failed to retrieve AWS region");
		throw e;
	}
};

export const performAwsIamLogin = async (region: string) => {
	const credentials = await fromNodeProviderChain()();

	if (!credentials.accessKeyId || !credentials.secretAccessKey) {
		throw new InfisicalSDKError("Credentials not found");
	}

	const iamRequestURL = `https://sts.${region}.amazonaws.com/`;
	const iamRequestBody = "Action=GetCallerIdentity&Version=2011-06-15";
	const iamRequestHeaders = {
		"Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
		Host: `sts.${region}.amazonaws.com`
	};

	const request = new HttpRequest({
		protocol: "https:",
		hostname: `sts.${region}.amazonaws.com`,
		path: "/",
		method: "POST",
		headers: {
			...iamRequestHeaders,
			"Content-Length": String(Buffer.byteLength(iamRequestBody))
		},
		body: iamRequestBody
	});

	const signer = new SignatureV4({
		credentials,
		region,
		service: "sts",
		sha256: Sha256
	});

	const signedRequest = await signer.sign(request);

	const headers: Record<string, string> = {};
	Object.entries(signedRequest.headers).forEach(([key, value]) => {
		if (typeof value === "string") {
			// Normalize Authorization header to proper case
			const normalizedKey = key.toLowerCase() === "authorization" ? "Authorization" : key;
			headers[normalizedKey] = value;
		}
	});

	return {
		iamHttpRequestMethod: "POST",
		iamRequestUrl: iamRequestURL,
		iamRequestBody: iamRequestBody,
		iamRequestHeaders: headers
	};
};
