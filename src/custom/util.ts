import axios from "axios";
import { AWS_IDENTITY_DOCUMENT_URI, AWS_TOKEN_METADATA_URI } from "./constants";
import AWS from "aws-sdk";
import aws4 from "aws4";
export const getAwsRegion = async () => {
	const region = process.env.AWS_REGION; // Typically found in lambda runtime environment
	if (region) {
		return region;
	}

	try {
		const timeout = 1000;

		const tokenRes = await axios.get(AWS_TOKEN_METADATA_URI, {
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
			timeout: timeout
		});

		return identityResponse.data.region;
	} catch (e) {
		throw new Error("Failed to retrieve AWS region");
	}
};

export const performAwsIamLogin = async (baseUrl: string, identityId: string, region: string) => {
	const body = "Action=GetCallerIdentity&Version=2011-06-15";

	const signOpts = aws4.sign(
		{
			service: "sts",
			path: `/?${body}`,
			region
		},
		{
			accessKeyId: AWS.config.credentials?.accessKeyId,
			secretAccessKey: AWS.config.credentials?.secretAccessKey
		}
	);

	return {
		iamHttpRequestMethod: "POST",
		iamRequestUrl: signOpts.host,
		iamRequestBody: body,
		iamRequestHeaders: signOpts.headers
	} as const;
};