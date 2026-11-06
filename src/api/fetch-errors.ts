export interface FetchHttpErrorResponse {
	/** Parsed JSON body when possible, otherwise the raw text. */
	data: unknown;
	status: number;
	config: {
		url: string;
		method: string;
	};
}

export class FetchHttpError extends Error {
	public readonly name = "FetchHttpError";
	/**
	 * The response, readable as before but not enumerable, so printing or logging this error, or an SDK error that has
	 * it as its cause, leaves out the body, which can be a whole HTML error page.
	 */
	declare public readonly response: FetchHttpErrorResponse;

	constructor(message: string, response: FetchHttpErrorResponse) {
		super(message);
		Object.defineProperty(this, "response", { value: response, enumerable: false });
	}
}

export const isFetchHttpError = (e: unknown): e is FetchHttpError =>
	e instanceof FetchHttpError;
