import { InfisicalSDK } from "../src";

(async () => {
	const client = new InfisicalSDK({
		siteUrl: "https://app.infisical.com" // Optional, defaults to https://app.infisical.com
	});

	const universalAuthClientId = process.env.UNIVERSAL_AUTH_CLIENT_ID;
	const universalAuthClientSecret = process.env.UNIVERSAL_AUTH_CLIENT_SECRET;

	if (!universalAuthClientId || !universalAuthClientSecret) {
		throw new Error("UNIVERSAL_AUTH_CLIENT_ID and UNIVERSAL_AUTH_CLIENT_SECRET must be set");
	}

	await client.auth().universalAuth.login({
		clientId: universalAuthClientId,
		clientSecret: universalAuthClientSecret
	});

	// List all accessible projects
	console.log("Listing all projects...");
	const projects = await client.projects().listProjects();
	console.log(`Found ${projects.length} projects:`);
	projects.forEach(project => {
		console.log(`  - ${project.name} (${project.slug}) - Org: ${project.orgId}`);
	});

	// Get identity details by ID
	// You can extract the identity ID from the JWT token or use a known identity ID
	const identityId = "your-identity-id-here";
	
	console.log(`\nFetching identity details for ${identityId}...`);
	const identity = await client.identities().getIdentityById(identityId);
	console.log(`Identity: ${identity.identity.name}`);
	console.log(`Organization ID: ${identity.identity.orgId}`);
	console.log(`Role: ${identity.role}`);
	console.log(`Auth Methods: ${identity.identity.authMethods.join(", ")}`);
})();
