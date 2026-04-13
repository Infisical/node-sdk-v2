import { isHTTPError } from "ky";

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
  if (isHTTPError(error)) {
    const data = error.data as { message?: string } | undefined;

    if (data?.message) {
      let message = data.message;
      if (error.response.status === 422) {
        message = JSON.stringify(data);
      }

      return new InfisicalSDKRequestError(message, {
        url: error.request.url,
        method: error.request.method,
        statusCode: error.response.status,
      });
    } else if (error.message) {
      return new InfisicalSDKError(error.message);
    } else if (error.response.status) {
      return new InfisicalSDKError(error.response.status.toString());
    } else {
      return new InfisicalSDKError("Request failed with unknown error");
    }
  }

  return new InfisicalSDKError(error?.message || "An error occurred");
};
