import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithRetry, isConnectError } from "../src/api/retry";

const okResponse = () => new Response("ok", { status: 200 });
const rateLimitResponse = () => new Response("rate limited", { status: 429 });
const serverErrorResponse = () => new Response("error", { status: 500 });

describe("fetchWithRetry", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns response on first successful try", async () => {
		const fn = vi.fn().mockResolvedValue(okResponse());

		const result = await fetchWithRetry(fn, { maxRetries: 3 });

		expect(result.status).toBe(200);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("does not retry on non-429 error responses", async () => {
		const fn = vi.fn().mockResolvedValue(serverErrorResponse());

		const result = await fetchWithRetry(fn, { maxRetries: 3 });

		expect(result.status).toBe(500);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("retries on 429 and succeeds after recovery", async () => {
		const fn = vi
			.fn()
			.mockResolvedValueOnce(rateLimitResponse())
			.mockResolvedValueOnce(rateLimitResponse())
			.mockResolvedValueOnce(okResponse());

		const promise = fetchWithRetry(fn, {
			maxRetries: 3,
			initialDelayMs: 100,
		});

		// Drain the two retry delays
		await vi.advanceTimersByTimeAsync(100);
		await vi.advanceTimersByTimeAsync(500);

		const result = await promise;
		expect(result.status).toBe(200);
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("returns 429 response when retries exhausted", async () => {
		const fn = vi.fn().mockResolvedValue(rateLimitResponse());

		const promise = fetchWithRetry(fn, {
			maxRetries: 2,
			initialDelayMs: 100,
		});

		// Drain all retry delays
		await vi.advanceTimersByTimeAsync(100);
		await vi.advanceTimersByTimeAsync(500);

		const result = await promise;
		expect(result.status).toBe(429);
		// 1 initial + 2 retries = 3 calls
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("retries on network errors and succeeds after recovery", async () => {
		let callCount = 0;
		const fn = vi.fn().mockImplementation(() => {
			callCount++;
			if (callCount === 1) throw new TypeError("fetch failed");
			return Promise.resolve(okResponse());
		});

		const promise = fetchWithRetry(fn, {
			maxRetries: 2,
			initialDelayMs: 100,
		});

		await vi.advanceTimersByTimeAsync(500);

		const result = await promise;
		expect(result.status).toBe(200);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("throws after network error retries exhausted", async () => {
		const fn = vi.fn().mockImplementation(() => {
			throw new TypeError("fetch failed");
		});

		const promise = fetchWithRetry(fn, {
			maxRetries: 2,
			initialDelayMs: 100,
		});

		// Register rejection handler before advancing timers to avoid
		// unhandled rejection warnings.
		const assertion = expect(promise).rejects.toThrow("fetch failed");

		await vi.runAllTimersAsync();
		await assertion;

		// 1 initial + 2 retries = 3 calls
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("maxRetries=0 means one attempt with no retries", async () => {
		const fn = vi.fn().mockResolvedValue(rateLimitResponse());

		const result = await fetchWithRetry(fn, { maxRetries: 0 });

		expect(result.status).toBe(429);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("maxRetries=0 throws immediately on network error", async () => {
		const fn = vi.fn().mockImplementation(() => {
			throw new TypeError("fetch failed");
		});

		await expect(
			fetchWithRetry(fn, { maxRetries: 0 })
		).rejects.toThrow("fetch failed");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("throws RangeError for negative maxRetries", async () => {
		const fn = vi.fn();

		await expect(
			fetchWithRetry(fn, { maxRetries: -1 })
		).rejects.toThrow(RangeError);
	});

	it("throws RangeError for non-finite maxRetries", async () => {
		const fn = vi.fn();

		await expect(
			fetchWithRetry(fn, { maxRetries: Infinity })
		).rejects.toThrow(RangeError);

		await expect(
			fetchWithRetry(fn, { maxRetries: NaN })
		).rejects.toThrow(RangeError);
	});

	it("uses exponential backoff for delays", async () => {
		const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
		const fn = vi.fn().mockImplementation(() => {
			throw new TypeError("fetch failed");
		});

		const promise = fetchWithRetry(fn, {
			maxRetries: 3,
			initialDelayMs: 1000,
			backoffFactor: 2,
		});

		const assertion = expect(promise).rejects.toThrow();
		await vi.runAllTimersAsync();
		await assertion;

		// Filter setTimeout calls that are retry delays (exclude tiny or 0ms calls)
		const delayCalls = setTimeoutSpy.mock.calls
			.map((call) => call[1] as number)
			.filter((ms) => ms >= 500);

		expect(delayCalls).toHaveLength(3);

		// attempt 1: ~1000ms (1000 * 2^0 ± 20% jitter → 800-1200)
		expect(delayCalls[0]).toBeGreaterThanOrEqual(800);
		expect(delayCalls[0]).toBeLessThanOrEqual(1200);

		// attempt 2: ~2000ms (1000 * 2^1 ± 20% jitter → 1600-2400)
		expect(delayCalls[1]).toBeGreaterThanOrEqual(1600);
		expect(delayCalls[1]).toBeLessThanOrEqual(2400);

		// attempt 3: ~4000ms (1000 * 2^2 ± 20% jitter → 3200-4800)
		expect(delayCalls[2]).toBeGreaterThanOrEqual(3200);
		expect(delayCalls[2]).toBeLessThanOrEqual(4800);

		setTimeoutSpy.mockRestore();
	});

	it("throws a network error that shouldRetryError rejects without retrying", async () => {
		const error = new TypeError("fetch failed");
		const fn = vi.fn().mockRejectedValue(error);
		const shouldRetryError = vi.fn().mockReturnValue(false);

		await expect(
			fetchWithRetry(fn, { maxRetries: 3, shouldRetryError })
		).rejects.toBe(error);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(shouldRetryError).toHaveBeenCalledWith(error);
	});
});

describe("isConnectError", () => {
	const withCode = (code: string) => Object.assign(new Error(code), { code });
	const fetchFailed = (cause: unknown) => new TypeError("fetch failed", { cause });

	it.each(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "EHOSTUNREACH", "ENETUNREACH", "UND_ERR_CONNECT_TIMEOUT"])(
		"is true for %s, the way Node's fetch reports it",
		(code) => {
			expect(isConnectError(fetchFailed(withCode(code)))).toBe(true);
		}
	);

	it("is true when every address of a host refuses the connection", () => {
		// Node tries each address of a host like localhost, and reports one AggregateError with the first error's code.
		const refused = Object.assign(
			new AggregateError([withCode("ECONNREFUSED"), withCode("ECONNREFUSED")]),
			{ code: "ECONNREFUSED" }
		);
		expect(isConnectError(fetchFailed(refused))).toBe(true);
	});

	it("is true for a fetch implementation that throws the network error itself", () => {
		expect(isConnectError(withCode("ECONNREFUSED"))).toBe(true);
	});

	it.each([
		["a timeout", new DOMException("The request timed out after 10 seconds", "TimeoutError")],
		["a reset connection", fetchFailed(withCode("ECONNRESET"))],
		["a socket closed after the request was sent", fetchFailed(withCode("UND_ERR_SOCKET"))],
		["an error without a code", new TypeError("fetch failed")],
		["a value that isn't an error", undefined],
	])("is false for %s", (_, error) => {
		expect(isConnectError(error)).toBe(false);
	});
});
