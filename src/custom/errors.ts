import { isFetchHttpError } from "../api/fetch-errors";

export class InfisicalSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = "InfisicalSDKError";
  }
}

export class InfisicalSDKRequestError extends Error {
  constructor(
    message: string,
    requestData: {
      url: string;
      method: string;
      statusCode: number;
    }
  ) {
    super(message);
    this.message = `[URL=${requestData.url}] [Method=${requestData.method}] [StatusCode=${requestData.statusCode}] ${message}`;
    this.name = "InfisicalSDKRequestError";
  }
}

export const newInfisicalError = (error: any) => {
  if (isFetchHttpError(error)) {
    const data = error.response.data as Record<string, unknown> | null | undefined;
    // A validation error (422) lists its issues in message, which isn't a string, so the whole body is the message.
    const isValidationError = error.response.status === 422 && typeof data === "object" && data !== null;

    if (typeof data?.message === "string" || isValidationError) {
      const message = isValidationError ? JSON.stringify(data) : String(data?.message);

      return new InfisicalSDKRequestError(message, {
        url: error.response.config.url,
        method: error.response.config.method,
        statusCode: error.response.status,
      });
    } else if (error.message) {
      return new InfisicalSDKError(error.message);
    }  else {
      return new InfisicalSDKError("Request failed with unknown error");
    }
  }

  return new InfisicalSDKError(error?.message || "An error occurred");
};
