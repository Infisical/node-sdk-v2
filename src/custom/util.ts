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

export const performAwsIamLogin = async (baseUrl: string, identityId: string, region: string) => {
	const body = "Action=GetCallerIdentity&Version=2011-06-15";

	AWS.config.update({
		region
	});

	const creds = await new Promise<{ sessionToken?: string; accessKeyId: string; secretAccessKey: string }>((resolve, reject) => {
		AWS.config.getCredentials((err, res) => {
			if (err) {
				throw err;
			} else {
				if (!res) {
					throw new Error("Credentials not found");
				}
				return resolve(res);
			}
		});
	});

	console.log("creds", creds);

	const signOpts = aws4.sign(
		{
			service: "sts",
			path: `/?${body}`,
			region
		},
		{
			accessKeyId: creds.accessKeyId,
			secretAccessKey: creds.secretAccessKey,
			sessionToken: creds.sessionToken
		}
	);

	delete signOpts.headers?.host;
	delete signOpts.headers?.Host;
	const headers = {
		...signOpts.headers
	};
	return {
		iamHttpRequestMethod: "POST",
		iamRequestUrl: signOpts.host,
		iamRequestBody: body,
		iamRequestHeaders: headers
	} as const;
};
