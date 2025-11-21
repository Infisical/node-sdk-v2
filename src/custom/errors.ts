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
    },
  ) {
    super(message);
    this.message = `[URL=${requestData.url}] [Method=${requestData.method}] [StatusCode=${requestData.statusCode}] ${message}`;
    this.name = "InfisicalSDKRequestError";
  }
}

export const newInfisicalError = async (error: any) => {
  if (isHTTPError(error)) {
    const data = await error.response.json<{ message: string }>();

    if (data?.message) {
      let message = data.message;
      if (error.response?.status === 422) {
        message = JSON.stringify(data);
      }

      return new InfisicalSDKRequestError(message, {
        url: error.request?.url || "",
        method: error.request?.method || "",
        statusCode: error.response?.status || 0,
      });
    } else if (error.message) {
      return new InfisicalSDKError(error.message);
    } else {
      return new InfisicalSDKError("Request failed with unknown error");
    }
  }

  return new InfisicalSDKError(error?.message || "An error occurred");
};
