import assert from "node:assert/strict";
import { InfisicalSDK } from "../src";

const SITE_URL = process.env.SITE_URL || "https://app.infisical.com";

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		console.error(`Missing required environment variable: ${name}`);
		process.exit(1);
	}
	return value;
}

async function run(tests: Array<{ name: string; fn: () => Promise<void> }>) {
	let passed = 0;
	let failed = 0;

	for (const test of tests) {
		try {
			await test.fn();
			console.log(`  PASS  ${test.name}`);
			passed++;
		} catch (err: any) {
			console.error(`  FAIL  ${test.name}`);
			console.error(`        ${err.message}`);
			failed++;
		}
	}

	console.log(`\n${passed} passed, ${failed} failed, ${tests.length} total`);

	if (failed > 0) {
		process.exit(1);
	}
}

(async () => {
	const clientId = requireEnv("UNIVERSAL_AUTH_CLIENT_ID");
	const clientSecret = requireEnv("UNIVERSAL_AUTH_CLIENT_SECRET");
	const projectId = requireEnv("PROJECT_ID");
	const environmentSlug = requireEnv("ENVIRONMENT_SLUG");

	const client = new InfisicalSDK({ siteUrl: SITE_URL });

	await client.auth().universalAuth.login({
		clientId,
		clientSecret,
	});

	console.log(`\nRunning read-only tests against ${SITE_URL}\n`);

	let firstSecretKey: string | undefined;

	await run([
		{
			name: "auth: getAccessToken returns a non-empty string",
			fn: async () => {
				const token = client.auth().getAccessToken();
				assert.ok(token, "access token should be truthy");
				assert.equal(typeof token, "string");
				assert.ok(token.length > 0, "access token should not be empty");
			},
		},
		{
			name: "secrets: listSecrets returns secrets array",
			fn: async () => {
				const res = await client.secrets().listSecrets({
					projectId,
					environment: environmentSlug,
				});

				assert.ok(res, "response should be defined");
				assert.ok(Array.isArray(res.secrets), "secrets should be an array");

				for (const secret of res.secrets) {
					assert.equal(typeof secret.id, "string", "secret.id should be a string");
					assert.equal(typeof secret.secretKey, "string", "secret.secretKey should be a string");
					assert.equal(typeof secret.secretValue, "string", "secret.secretValue should be a string");
				}

				if (res.secrets.length > 0) {
					firstSecretKey = res.secrets[0].secretKey;
				}
			},
		},
		{
			name: "secrets: listSecretsWithImports returns an array",
			fn: async () => {
				const secrets = await client.secrets().listSecretsWithImports({
					projectId,
					environment: environmentSlug,
				});

				assert.ok(Array.isArray(secrets), "result should be an array");

				for (const secret of secrets) {
					assert.equal(typeof secret.secretKey, "string", "secretKey should be a string");
				}
			},
		},
		{
			name: "secrets: getSecret retrieves a specific secret by name",
			fn: async () => {
				if (!firstSecretKey) {
					console.log("        (skipped — no secrets in project)");
					return;
				}

				const secret = await client.secrets().getSecret({
					secretName: firstSecretKey,
					projectId,
					environment: environmentSlug,
				});

				assert.ok(secret, "secret should be defined");
				assert.equal(secret.secretKey, firstSecretKey, "secretKey should match the requested name");
				assert.equal(typeof secret.id, "string", "secret.id should be a string");
				assert.equal(typeof secret.secretValue, "string", "secret.secretValue should be a string");
			},
		},
		{
			name: "folders: listFolders returns an array",
			fn: async () => {
				const folders = await client.folders().listFolders({
					projectId,
					environment: environmentSlug,
					path: "/",
				});

				assert.ok(Array.isArray(folders), "folders should be an array");

				for (const folder of folders) {
					assert.equal(typeof folder.id, "string", "folder.id should be a string");
					assert.equal(typeof folder.name, "string", "folder.name should be a string");
				}
			},
		},
	]);
})();
