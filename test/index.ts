import { InfisicalSDK } from "../src";

const PROJECT_ID = "PROJECT_ID";

(async () => {
	const client = new InfisicalSDK({
		siteUrl: "http://localhost:8080" // Optional, defaults to https://app.infisical.com
	});

	await client.auth().universalAuth.login({
		clientId: "CLIENT_ID",
		clientSecret: "CLIENT_SECRET"
	});

	const environment = await client.environments().create({
		name: "Demo Environment",
		projectId: "<your-project-id>",
		slug: "demo-environment",
		position: 1 // Optional
	});

	const project = await client.projects().create({
		projectName: "<name-of-project>",
		type: "secret-manager", // cert-manager, secret-manager, kms, ssh
		projectDescription: "<project-description>", // Optional
		slug: "<slug-of-project-to-create>", // Optional
		template: "<project-template-name>", // Optional
		kmsKeyId: "kms-key-id" // Optional
	});

	const folder = await client.folders().create({
		name: "<folder-name>",
		path: "<folder-path>",
		projectId: "<your-project-id>",
		environment: "<environment-slug>",
		description: "<folder-description>" // Optional
	});
})();
