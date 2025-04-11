import { InfisicalSDK } from "../src";

(async () => {
	const client = new InfisicalSDK({
		siteUrl: "http://localhost:8080" // Optional, defaults to https://app.infisical.com
	});

	const EMAIL_TO_INVITE = "<your-email>";

	const universalAuthClientId = process.env.UNIVERSAL_AUTH_CLIENT_ID;
	const universalAuthClientSecret = process.env.UNIVERSAL_AUTH_CLIENT_SECRET;

	if (!universalAuthClientId || !universalAuthClientSecret) {
		throw new Error("UNIVERSAL_AUTH_CLIENT_ID and UNIVERSAL_AUTH_CLIENT_SECRET must be set");
	}

	await client.auth().universalAuth.login({
		clientId: universalAuthClientId,
		clientSecret: universalAuthClientSecret
	});

	console.log("Creating project");
	const project = await client.projects().create({
		projectDescription: "test description",
		projectName: "test project1344assdfd",
		type: "secret-manager",
		slug: "test-project1assdfd43"
	});

	const environment = await client.environments().create({
		position: 100,
		slug: "test-environment-custom-slug",
		name: "test environment",
		projectId: project.id
	});

	console.log("Creating folder");
	const folder = await client.folders().create({
		name: "test-folder",
		projectId: project.id,
		environment: environment.slug
	});

	console.log("Inviting member to project");
	const memberships = await client.projects().inviteMembers({
		projectId: project.id,
		emails: [EMAIL_TO_INVITE],
		roleSlugs: ["admin"]
	});

	console.log("Memberships", memberships);
})();
