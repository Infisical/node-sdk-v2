import { AxiosError } from "axios";
import { InfisicalSDK } from "../src";

const PROJECT_ID = "PROJECT_ID";

(async () => {
	const client = new InfisicalSDK({
		siteUrl: "http://localhost:8080" // Optional, defaults to https://app.infisical.com
	});

	await client.auth().universalAuth.login({
		// For localhost
		clientId: "CLIENT_ID",
		clientSecret: "CLIENT_SECRET"
	});

	const dynamicSecret = await client
		.dynamicSecrets()
		.leases.create({
			dynamicSecretName: "test-redis",
			projectSlug: "11-w-hfo",
			environmentSlug: "dev"
		})
		.catch(err => {
			if (err instanceof AxiosError) {
				console.log(err.response?.data);
			}
			throw new Error("oops");
		});

	console.log(dynamicSecret);

	// // process.exit(0);

	const allSecrets = await client.secrets().listSecrets({
		environment: "dev",
		projectId: PROJECT_ID,
		expandSecretReferences: true,
		includeImports: false,
		recursive: false
	});
	console.log(allSecrets.secrets);

	const singleSecret = await client.secrets().getSecret({
		environment: "dev",
		projectId: PROJECT_ID,
		secretName: "TEST1",
		expandSecretReferences: true, // Optional
		includeImports: true, // Optional

		type: "shared", // Optional
		version: 1 // Optional
	});
	console.log(`Fetched single secret, ${singleSecret}=${singleSecret.secretValue}`);

	const newSecret = await client.secrets().createSecret("NEW_SECRET_NAME22423423", {
		environment: "dev",
		projectId: PROJECT_ID,
		secretValue: "SECRET_VALUE"
	});
	console.log(`You created a new secret: ${newSecret.secret.secretKey}`);

	const updatedSecret = await client.secrets().updateSecret("NEW_SECRET_NAME22423423", {
		environment: "dev",
		projectId: PROJECT_ID,
		secretValue: "UPDATED_SECRET_VALUE",
		newSecretName: "NEW_SECRET_NAME22222", // Optional
		secretComment: "This is an updated secret", // Optional

		secretReminderNote: "This is an updated reminder note", // Optional
		secretReminderRepeatDays: 14, // Optional
		skipMultilineEncoding: false, // Optional
		metadata: {
			// Optional
			extra: "metadata"
		}
	});
	console.log(`You updated the secret: ${updatedSecret.secret.secretKey}`);

	const deletedSecret = await client.secrets().deleteSecret("NEW_SECRET_NAME22222", {
		environment: "dev",
		projectId: PROJECT_ID
	});
	console.log(`You deleted the secret: ${deletedSecret.secret.secretKey}`);
})();
