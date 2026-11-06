import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiClient, buildUrl, parseBody } from "../src/api/base";

describe("response body timeout", () => {
	it.each([
		{ status: 200, timeout: undefined, method: "get" },
		{ status: 503, timeout: undefined, method: "get" },
		{ status: 200, timeout: 200.5, method: "get" },
		{ status: 200, timeout: undefined, method: "postOnce" },
		{ status: 503, timeout: undefined, method: "deleteOnce" },
	] as const)("aborts a stalled $status body for $method with timeout override $timeout", async ({ status, timeout, method }) => {
		let headersSent = false;
		let slowRequests = 0;
		let bodyFinished = false;
		const server = createServer((request, response) => {
			response.writeHead(request.url === "/slow" ? status : 200, {
				"Content-Type": "application/json",
			});
			if (request.url !== "/slow") {
				response.end('{"message":"ready"}');
				return;
			}
			slowRequests++;
			response.write('{"message":');
			headersSent = true;
			const timer = setTimeout(() => {
				bodyFinished = true;
				response.end('"finished"}');
			}, 600);
			response.once("close", () => clearTimeout(timer));
		});
		server.listen(0, "127.0.0.1");
		await once(server, "listening");
		const { port } = server.address() as AddressInfo;
		const client = new ApiClient({
			baseURL: `http://127.0.0.1:${port}`,
			timeout: timeout === undefined ? 200 : 1_000,
		});
		try {
			const request = method === "postOnce"
				? client.postOnce("/slow", undefined, { timeout })
				: client[method]("/slow", { timeout });
			await expect(request).rejects.toMatchObject({
				name: "TimeoutError",
			});
			expect(headersSent).toBe(true);
			expect(slowRequests).toBe(1);
			expect(bodyFinished).toBe(false);
			await expect(client.get("/fast")).resolves.toEqual({ message: "ready" });
		} finally {
			server.closeAllConnections();
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	it("uses a fresh timeout after a rate-limit retry", async () => {
		let attempts = 0;
		const server = createServer((_request, response) => {
			attempts++;
			response.writeHead(attempts === 1 ? 429 : 200, {
				"Content-Type": "application/json",
			});
			response.end('{"message":"ready"}');
		});
		server.listen(0, "127.0.0.1");
		await once(server, "listening");
		const { port } = server.address() as AddressInfo;
		const client = new ApiClient({
			baseURL: `http://127.0.0.1:${port}`,
			timeout: 200,
		});
		try {
			await expect(client.get("/retry")).resolves.toEqual({ message: "ready" });
			expect(attempts).toBe(2);
		} finally {
			server.closeAllConnections();
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});
});

describe("parseBody", () => {
	it("returns undefined for 204 status", async () => {
		const response = new Response(null, { status: 204 });
		expect(await parseBody(response)).toBeUndefined();
	});

	it("returns undefined for empty body", async () => {
		const response = new Response("", { status: 200 });
		expect(await parseBody(response)).toBeUndefined();
	});

	it("parses valid JSON", async () => {
		const data = { key: "value", count: 42 };
		const response = new Response(JSON.stringify(data), { status: 200 });
		expect(await parseBody(response)).toEqual(data);
	});

	it("parses JSON array", async () => {
		const data = [1, 2, 3];
		const response = new Response(JSON.stringify(data), { status: 200 });
		expect(await parseBody(response)).toEqual(data);
	});

	it("returns raw text for non-JSON body", async () => {
		const html = "<html><body>Error</body></html>";
		const response = new Response(html, { status: 200 });
		expect(await parseBody(response)).toBe(html);
	});

	it("returns raw text for plain text body", async () => {
		const text = "plain text response";
		const response = new Response(text, { status: 200 });
		expect(await parseBody(response)).toBe(text);
	});
});

describe("buildUrl", () => {
	const base = "https://example.com/api/v1/";

	it("appends relative path to baseURL", () => {
		expect(buildUrl(base, "secrets/raw")).toBe(
			"https://example.com/api/v1/secrets/raw"
		);
	});

	it("strips leading / from path to avoid double slash", () => {
		expect(buildUrl(base, "/secrets/raw")).toBe(
			"https://example.com/api/v1/secrets/raw"
		);
	});

	it("appends query params correctly", () => {
		const result = buildUrl(base, "secrets", {
			environment: "prod",
			path: "/",
		});
		const url = new URL(result);
		expect(url.searchParams.get("environment")).toBe("prod");
		expect(url.searchParams.get("path")).toBe("/");
	});

	it("excludes undefined params", () => {
		const result = buildUrl(base, "secrets", {
			environment: "prod",
			path: undefined,
		});
		const url = new URL(result);
		expect(url.searchParams.get("environment")).toBe("prod");
		expect(url.searchParams.has("path")).toBe(false);
	});

	it("excludes null params", () => {
		const result = buildUrl(base, "secrets", {
			environment: "prod",
			path: null,
		});
		const url = new URL(result);
		expect(url.searchParams.get("environment")).toBe("prod");
		expect(url.searchParams.has("path")).toBe(false);
	});

	it("handles boolean param values", () => {
		const result = buildUrl(base, "secrets", { includeImports: true });
		const url = new URL(result);
		expect(url.searchParams.get("includeImports")).toBe("true");
	});

	it("handles number param values", () => {
		const result = buildUrl(base, "secrets", { limit: 100 });
		const url = new URL(result);
		expect(url.searchParams.get("limit")).toBe("100");
	});

	it("works with baseURL that has a path component", () => {
		const result = buildUrl(
			"https://app.infisical.com/api/",
			"v3/secrets/raw"
		);
		expect(result).toBe("https://app.infisical.com/api/v3/secrets/raw");
	});

	it("returns baseURL + path when no params provided", () => {
		expect(buildUrl(base, "folders")).toBe(
			"https://example.com/api/v1/folders"
		);
	});
});

describe("serializeBody", () => {
	const baseURL = "https://example.com/api/v1/";

	let fetchSpy: ReturnType<typeof vi.fn>;
	let client: ApiClient;

	beforeEach(() => {
		fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchSpy);
		client = new ApiClient({ baseURL });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const lastFetchInit = (): RequestInit => {
		expect(fetchSpy).toHaveBeenCalled();
		return fetchSpy.mock.calls.at(-1)?.[1] as RequestInit;
	};

	const getHeader = (init: RequestInit, key: string): string | undefined => {
		const headers = init.headers as unknown;
		if (!headers) return undefined;
		if (headers instanceof Headers) return headers.get(key) ?? undefined;
		if (Array.isArray(headers)) {
			const match = headers.find(([k]) => k.toLowerCase() === key.toLowerCase());
			return match?.[1];
		}
		return (headers as Record<string, string>)[key];
	};

	it("JSON-stringifies an object body with default Content-Type", async () => {
		await client.post("/x", { a: 1 });

		const init = lastFetchInit();
		expect(init.body).toBe('{"a":1}');
		expect(getHeader(init, "Content-Type")).toBe("application/json");
	});

	it("JSON-stringifies an object body when application/json is passed explicitly", async () => {
		await client.post(
			"/x",
			{ a: 1 },
			{ headers: { "Content-Type": "application/json" } }
		);

		const init = lastFetchInit();
		expect(init.body).toBe('{"a":1}');
		expect(getHeader(init, "Content-Type")).toBe("application/json");
	});

	it("returns undefined body and no Content-Type when data is undefined", async () => {
		await client.post("/x", undefined);

		const init = lastFetchInit();
		expect(init.body).toBeUndefined();
		expect(getHeader(init, "Content-Type")).toBeUndefined();
	});

	it("form-urlencodes a plain object when Content-Type is application/x-www-form-urlencoded", async () => {
		await client.post(
			"/x",
			{ a: 1, b: "x" },
			{ headers: { "Content-Type": "application/x-www-form-urlencoded" } }
		);

		const init = lastFetchInit();
		expect(init.body).toBe("a=1&b=x");
		expect(getHeader(init, "Content-Type")).toBe(
			"application/x-www-form-urlencoded"
		);
	});

	it("drops null and undefined values when form-urlencoding an object", async () => {
		await client.post(
			"/x",
			{ a: 1, b: undefined, c: null, d: "x" },
			{ headers: { "Content-Type": "application/x-www-form-urlencoded" } }
		);

		const init = lastFetchInit();
		expect(init.body).toBe("a=1&d=x");
	});

	it("serializes URLSearchParams for form-urlencoded Content-Type", async () => {
		await client.post(
			"/x",
			new URLSearchParams({ a: "1" }),
			{ headers: { "Content-Type": "application/x-www-form-urlencoded" } }
		);

		const init = lastFetchInit();
		expect(init.body).toBe("a=1");
	});

	it("passes through a pre-encoded string for form-urlencoded Content-Type", async () => {
		await client.post(
			"/x",
			"pre=encoded",
			{ headers: { "Content-Type": "application/x-www-form-urlencoded" } }
		);

		const init = lastFetchInit();
		expect(init.body).toBe("pre=encoded");
	});

	it("throws TypeError when form-urlencoded data is not an object, string, or URLSearchParams", async () => {
		expect(() =>
			client.post("/x", 42, {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			})
		).toThrow(TypeError);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("passes through a string body for non-JSON, non-form Content-Type", async () => {
		await client.post("/x", "raw string", {
			headers: { "Content-Type": "text/plain" },
		});

		const init = lastFetchInit();
		expect(init.body).toBe("raw string");
		expect(getHeader(init, "Content-Type")).toBe("text/plain");
	});

	it("throws TypeError when non-JSON Content-Type receives a non-string body", async () => {
		expect(() =>
			client.post("/x", { a: 1 }, { headers: { "Content-Type": "text/plain" } })
		).toThrow(/pre-serialized string/);
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});

describe("postOnce", () => {
	const baseURL = "https://example.com/api/v1/";

	let fetchSpy: ReturnType<typeof vi.fn>;
	let client: ApiClient;

	// Node's fetch throws a TypeError with the network error as its cause.
	const networkError = (code: string) =>
		new TypeError("fetch failed", { cause: Object.assign(new Error(code), { code }) });
	const okResponse = () => new Response('{"ok":true}', { status: 200 });

	beforeEach(() => {
		vi.useFakeTimers();
		fetchSpy = vi.fn();
		vi.stubGlobal("fetch", fetchSpy);
		client = new ApiClient({ baseURL });
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it.each(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "EHOSTUNREACH", "ENETUNREACH", "UND_ERR_CONNECT_TIMEOUT"])(
		"retries when the connection never opened (%s)",
		async (code) => {
			fetchSpy.mockRejectedValueOnce(networkError(code)).mockResolvedValueOnce(okResponse());

			const promise = client.postOnce("/x", { a: 1 });
			await vi.runAllTimersAsync();

			expect(await promise).toEqual({ ok: true });
			expect(fetchSpy).toHaveBeenCalledTimes(2);
		}
	);

	it.each([
		["a timeout", new DOMException("The request timed out after 10 seconds", "TimeoutError")],
		["a reset connection", networkError("ECONNRESET")],
		["a socket closed after the request was sent", networkError("UND_ERR_SOCKET")],
	])("doesn't retry %s, since the request may have reached the server", async (_, error) => {
		fetchSpy.mockRejectedValue(error);

		const assertion = expect(client.postOnce("/x", { a: 1 })).rejects.toBe(error);
		await vi.runAllTimersAsync();
		await assertion;

		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("retries a rate-limited response, since the server turned the request away", async () => {
		fetchSpy
			.mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
			.mockResolvedValueOnce(okResponse());

		const promise = client.postOnce("/x", { a: 1 });
		await vi.runAllTimersAsync();

		expect(await promise).toEqual({ ok: true });
		expect(fetchSpy).toHaveBeenCalledTimes(2);
	});

	it("sends the body and method like post", async () => {
		fetchSpy.mockResolvedValueOnce(okResponse());

		await client.postOnce("/x", { a: 1 });

		const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("https://example.com/api/v1/x");
		expect(init).toMatchObject({ method: "POST", body: '{"a":1}' });
	});

	it("rejects with a TimeoutError that says how long it waited", async () => {
		// fetch rejects with the abort reason, as Node's fetch does.
		fetchSpy.mockImplementation(
			(_url: string, init: RequestInit) =>
				new Promise((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)))
		);
		const client = new ApiClient({ baseURL, timeout: 2_500 });

		const assertion = expect(client.postOnce("/x", { a: 1 })).rejects.toMatchObject({
			name: "TimeoutError",
			message: "The request timed out after 2.5 seconds"
		});
		await vi.advanceTimersByTimeAsync(2_500);
		await assertion;
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("deleteOnce sends a JSON body, and retries when the connection never opened", async () => {
		fetchSpy.mockRejectedValueOnce(networkError("ECONNREFUSED")).mockResolvedValueOnce(okResponse());

		const promise = client.deleteOnce("/x", { data: { a: 1 } });
		await vi.runAllTimersAsync();

		expect(await promise).toEqual({ ok: true });
		expect(fetchSpy).toHaveBeenCalledTimes(2);
		expect(fetchSpy.mock.calls[1][1]).toMatchObject({ method: "DELETE", body: '{"a":1}' });
	});

	it("deleteOnce doesn't retry a timeout, since the request may have reached the server", async () => {
		const timeout = new DOMException("The request timed out after 10 seconds", "TimeoutError");
		fetchSpy.mockRejectedValue(timeout);

		const assertion = expect(client.deleteOnce("/x", { data: { a: 1 } })).rejects.toBe(timeout);
		await vi.runAllTimersAsync();
		await assertion;

		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("post still retries a network error that postOnce doesn't", async () => {
		fetchSpy.mockRejectedValueOnce(networkError("ECONNRESET")).mockResolvedValueOnce(okResponse());

		const promise = client.post("/x", { a: 1 });
		await vi.runAllTimersAsync();

		expect(await promise).toEqual({ ok: true });
		expect(fetchSpy).toHaveBeenCalledTimes(2);
	});
});
