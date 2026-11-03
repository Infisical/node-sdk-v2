export interface FetchRetryOptions {
	maxRetries?: number;
	initialDelayMs?: number;
	backoffFactor?: number;
	/** Whether to retry an error thrown by fetch, such as a network error. Defaults to retrying every one. */
	shouldRetryError?: (err: unknown) => boolean;
}

const DEFAULT_MAX_RETRIES = 4;
const DEFAULT_INITIAL_DELAY_MS = 1000;
const DEFAULT_BACKOFF_FACTOR = 2;
const JITTER_FRACTION = 0.2;

// Raised before a connection opens, so the request never reached the server: a failed DNS lookup,
// a refused connection, or a connection that timed out before it opened.
const CONNECT_ERROR_CODES = new Set([
	"ENOTFOUND",
	"EAI_AGAIN",
	"ECONNREFUSED",
	"UND_ERR_CONNECT_TIMEOUT",
]);

/** Whether a fetch error was raised before the request could reach the server, so retrying it can't make the server handle it twice. */
export const isConnectError = (err: unknown): boolean => {
	// Node's fetch throws a TypeError with the network error as its cause. Other fetch implementations throw the network error itself.
	const networkError = (err as { cause?: unknown } | null | undefined)?.cause ?? err;
	const code = (networkError as { code?: unknown } | null | undefined)?.code;
	return typeof code === "string" && CONNECT_ERROR_CODES.has(code);
};

const sleep = (ms: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));


export const fetchWithRetry = async (
	fn: () => Promise<Response>,
	opts: FetchRetryOptions = {}
): Promise<Response> => {
	const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;

	if (!Number.isFinite(maxRetries) || maxRetries < 0) {
		throw new RangeError("maxRetries must be a non-negative finite number");
	}

	const initialDelayMs = opts.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
	const backoffFactor = opts.backoffFactor ?? DEFAULT_BACKOFF_FACTOR;
	const shouldRetryError = opts.shouldRetryError ?? (() => true);

	const delayFor = (attempt: number): number => {
		const base = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
		return base + base * JITTER_FRACTION * (Math.random() * 2 - 1);
	};

	let attempt = 0;
	while (attempt <= maxRetries) {
		try {
			const response = await fn();

			if (response.status === 429 ) {
				attempt++;
				if (attempt > maxRetries) return response;
				await response.body?.cancel(); // cancel the body to release the socket back to pool
				await sleep(delayFor(attempt));
				continue;
			}

			return response;
		} catch (err) {
			attempt++;
			if (attempt > maxRetries || !shouldRetryError(err)) throw err;
			await sleep(delayFor(attempt));
		}
	}

	throw new Error("Unreachable: retry loop exhausted");
};
