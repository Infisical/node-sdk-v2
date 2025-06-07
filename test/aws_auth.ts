import { InfisicalSDK } from "../src";

(async () => {
	const client = new InfisicalSDK({
		siteUrl: "https://app.infisical.com" // Optional, defaults to https://app.infisical.com
	});

	await client.auth().awsIamAuth.login({
		identityId: "b1c540b8-4ca6-407e-8ce5-6696e8db50c4"
	});

	console.log(client.auth().getAccessToken());
})();
