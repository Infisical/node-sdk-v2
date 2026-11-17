import { describe, it, expect, afterEach, vi } from "vitest";
import { ApiClient } from "../src/api/base";
import { SecretsApi } from "../src/api/endpoints/secrets";
import SecretsClient from "../src/custom/secrets";

describe("getSecret", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends include_imports, the query param the v3 endpoint reads", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ secret: { secretKey: "COMMON_KEY" } }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			})
		);
		const client = new SecretsClient(new SecretsApi(new ApiClient({ baseURL: "https://example.com" })));

		await client.getSecret({
			projectId: "proj",
			environment: "prod",
			secretName: "COMMON_KEY",
			includeImports: true,
		});

		const url = new URL(String(fetchMock.mock.calls[0][0]));
		expect(url.searchParams.get("include_imports")).toBe("true");
		expect(url.searchParams.has("includeImports")).toBe(false);
	});
});
