import { InfisicalSDK } from "../src";

(async () => {
	const client = new InfisicalSDK();

	await client.auth().universalAuth.login({
		clientId: "d4ea369b-e918-4a1d-bceb-f8ccd03f507d",
		clientSecret: "2ff84a5173d7ae1d0f5b744053d9b28dce62010891e350b4f07869950f238fbc"
	});

	const secrets = await client.secrets().listSecrets({
		environment: "dev",
		workspaceId: "f1617cbc-be46-4466-89de-ec8767afeaab"
	});

	console.log(secrets.secrets);
})();
