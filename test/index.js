const { InfisicalSDK } = require("../lib");

(async () => {
	const client = new InfisicalSDK();

	await client.auth().universalAuth.login({
		clientId: "CLIENT_ID",
		clientSecret: "CLIENT_SECRET"
	});

	const secrets = await client.secrets().listSecrets({
		environment: "dev",
		workspaceId: "PROJECT_ID"
	});

	console.log(secrets.secrets);
})();
