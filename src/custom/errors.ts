import { AxiosError } from "axios";

type TApiErrorResponse = {
	statusCode: number;
	message: string;
	error: string;
};
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
	if (error instanceof AxiosError) {
		const data = error?.response?.data as TApiErrorResponse;

		if (data?.message) {
			return new InfisicalSDKRequestError(data.message, {
				url: error.response?.config.url || "",
				method: error.response?.config.method || "",
				statusCode: error.response?.status || 0
			});
		} else if (error.message) {
			return new InfisicalSDKError(error.message);
		} else if (error.code) {
			// If theres no message but a code is present, it's likely to be an aggregation error. This is not specific to Axios, but it falls under the AxiosError type
			return new InfisicalSDKError(error.code);
		} else {
			return new InfisicalSDKError("Request failed with unknown error");
		}
	}

	return new InfisicalSDKError(error?.message || "An error occurred");
};
