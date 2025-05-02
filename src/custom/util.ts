import axios from "axios";
import { AWS_IDENTITY_DOCUMENT_URI, AWS_TOKEN_METADATA_URI } from "./constants";
import AWS from "aws-sdk";
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
	AWS.config.update({
		region
	});

	await new Promise<{ sessionToken?: string; accessKeyId: string; secretAccessKey: string }>((resolve, reject) => {
		AWS.config.getCredentials((err, res) => {
			if (err) {
				throw err;
			} else {
				if (!res) {
					throw new InfisicalSDKError("Credentials not found");
				}
				return resolve(res);
			}
		});
	});

	const iamRequestURL = `https://sts.${region}.amazonaws.com/`;
	const iamRequestBody = "Action=GetCallerIdentity&Version=2011-06-15";
	const iamRequestHeaders = {
		"Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
		Host: `sts.${region}.amazonaws.com`
	};

	const request = new AWS.HttpRequest(new AWS.Endpoint(iamRequestURL), region);
	request.method = "POST";
	request.headers = iamRequestHeaders;

	// @ts-expect-error -- .util is not typed
	request.headers["X-Amz-Date"] = AWS.util.date.iso8601(new Date()).replace(/[:-]|\.\d{3}/g, "");
	request.body = iamRequestBody;
	request.headers["Content-Length"] = String(Buffer.byteLength(iamRequestBody));

	// @ts-expect-error -- .Signers is not typed
	const signer = new AWS.Signers.V4(request, "sts");
	signer.addAuthorization(AWS.config.credentials, new Date());

	return {
		iamHttpRequestMethod: "POST",
		iamRequestUrl: iamRequestURL,
		iamRequestBody: iamRequestBody,
		iamRequestHeaders: iamRequestHeaders
	} as const;
};
