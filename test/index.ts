import { InfisicalSDK } from "../src";

(async () => {
	const client = new InfisicalSDK();

	await client.auth().universalAuth.login({
		clientId: "CLIENT_ID",
		clientSecret: "CLIENT_SECRET"
	});

	const allSecrets = await client.secrets().listSecrets({
		environment: "dev",
		workspaceId: "PROJECT_ID"
	});
	console.log(allSecrets.secrets);

	const singleSecret = await client.secrets().getSecret({
		secretName: "SECRET_NAME",
		environment: "dev"
	});
	console.log(`Fetched single secret, ${singleSecret.secretKey}=${singleSecret.secretValue}`);

	const newSecret = await client.secrets().createSecret("NEW_SECRET_NAME", {
		environment: "dev",
		workspaceId: "PROJECT_ID",
		secretValue: "INITIAL SECRET VALUE!"
	});
	console.log(`You created a new secret: ${newSecret.secret}`);

	const updatedSecret = await client.secrets().updateSecret("NEW_SECRET_NAME", {
		environment: "dev",
		workspaceId: "PROJECT_ID",
		secretValue: "NEW SECRET VALUE!"
	});
	console.log(`You updated the secret: ${updatedSecret.secret}`);

	const deletedSecret = await client.secrets().deleteSecret("NEW_SECRET_NAME", {
		environment: "dev",
		workspaceId: "PROJECT_ID"
	});
	console.log(`You deleted the secret: ${deletedSecret.secret}`);
})();
