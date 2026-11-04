import { isFetchHttpError } from "../api/fetch-errors";

export class InfisicalSDKError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.message = message;
    this.name = "InfisicalSDKError";
  }
}

export class InfisicalSDKRequestError extends Error {
  /** The HTTP status code that Infisical responded with. */
  public readonly statusCode: number;

  constructor(
    message: string,
    requestData: {
      url: string;
      method: string;
      statusCode: number;
    },
    options?: ErrorOptions
  ) {
    super(message, options);
    this.message = `[URL=${requestData.url}] [Method=${requestData.method}] [StatusCode=${requestData.statusCode}] ${message}`;
    this.name = "InfisicalSDKRequestError";
    this.statusCode = requestData.statusCode;
  }
}

// Every error keeps the one it came from in cause. For a request that failed without a response, that's how a caller
// tells a timeout (a TimeoutError) from a connection that never opened (a TypeError whose cause has a code such as
// ECONNREFUSED), which matters when deciding whether to retry a request that must not run twice.
export const newInfisicalError = (error: any) => {
  // An error the SDK raised itself, such as for a refused argument, is already the one to throw.
  if (error instanceof InfisicalSDKError || error instanceof InfisicalSDKRequestError) {
    return error;
  }

  if (isFetchHttpError(error)) {
    const data = error.response.data as Record<string, unknown> | null | undefined;
    // A validation error (422) lists its issues in message, which isn't a string, so the whole body is the message.
    const isValidationError = error.response.status === 422 && typeof data === "object" && data !== null;

    if (typeof data?.message === "string" || isValidationError) {
      const message = isValidationError ? JSON.stringify(data) : String(data?.message);

      return new InfisicalSDKRequestError(
        message,
        {
          url: error.response.config.url,
          method: error.response.config.method,
          statusCode: error.response.status,
        },
        { cause: error }
      );
    } else if (error.message) {
      return new InfisicalSDKError(error.message, { cause: error });
    }  else {
      return new InfisicalSDKError("Request failed with unknown error", { cause: error });
    }
  }

  return new InfisicalSDKError(error?.message || "An error occurred", { cause: error });
};
