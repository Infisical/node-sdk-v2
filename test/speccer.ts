import https from "https";
import fs from "fs";

const specUrl = "https://app.infisical.com/api/docs/json";
const outputFile = "filtered-spec.json";

// List of endpoints you want to keep, with their HTTP methods

interface Endpoint {
	path: string;
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
}

const desiredEndpoints: Endpoint[] = [
	// Identities
	{ path: "/api/v1/identities", method: "POST" },
	{ path: "/api/v1/identities/{identityId}", method: "PATCH" },
	{ path: "/api/v1/identities/{identityId}", method: "DELETE" },
	{ path: "/api/v1/identities/{identityId}", method: "GET" },
	{ path: "/api/v1/identities", method: "GET" },

	// Token Auth
	{ path: "/api/v1/auth/token-auth/identities/{identityId}", method: "POST" },
	{ path: "/api/v1/auth/token-auth/identities/{identityId}", method: "GET" },
	{ path: "/api/v1/auth/token-auth/identities/{identityId}", method: "PATCH" },
	{ path: "/api/v1/auth/token-auth/identities/{identityId}", method: "DELETE" },
	{ path: "/api/v1/auth/token-auth/identities/{identityId}/tokens", method: "GET" },
	{ path: "/api/v1/auth/token-auth/identities/{identityId}/tokens", method: "POST" },
	{ path: "/api/v1/auth/token-auth/tokens/{tokenId}", method: "PATCH" },
	{ path: "/v1/auth/token-auth/tokens/{tokenId}/revoke", method: "POST" }
];

https
	.get(specUrl, res => {
		let data = "";

		res.on("data", chunk => {
			data += chunk;
		});

		res.on("end", () => {
			const spec = JSON.parse(data);

			// Filter the paths object
			spec.paths = Object.keys(spec.paths).reduce((filteredPaths, path) => {
				const matchingEndpoints = desiredEndpoints.filter(
					endpoint => endpoint.path === path && spec.paths[path][endpoint.method.toLowerCase()]
				);

				if (matchingEndpoints.length > 0) {
					// @ts-expect-error
					filteredPaths[path] = {};
					matchingEndpoints.forEach(endpoint => {
						// @ts-expect-error
						filteredPaths[path][endpoint.method.toLowerCase()] = spec.paths[path][endpoint.method.toLowerCase()];
					});
				}

				return filteredPaths;
			}, {});

			// Write the filtered spec to a file
			fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
			console.log(`Filtered spec written to ${outputFile}`);
		});
	})
	.on("error", err => {
		console.error("Error fetching spec:", err.message);
	});
