import { AxiosError } from "axios";

type TApiErrorResponse = {
	statusCode: number;
	message: string;
	error: string;
};
export class InfisicalError extends Error {
	constructor(message: string) {
		super(message);
		this.message = message;
		this.name = "InfisicalError";
	}
}

export class InfisicalRequestError extends Error {
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
		this.name = "InfisicalRequestError";
	}
}

export const newInfisicalError = (error: any) => {
	if (error instanceof AxiosError) {
		const data = error?.response?.data as TApiErrorResponse;

		if (data?.message) {
			// If there's a message in the response data, we know it's an API error
			return new InfisicalRequestError(data.message, {
				url: error.response?.config.url || "",
				method: error.response?.config.method || "",
				statusCode: error.response?.status || 0
			});
		} else if (error.message) {
			// If there's no message in the response data, it's likely to be a networking error
			return new InfisicalError(error.message);
		} else if (error.code) {
			// If theres no message but a code is present, it's likely to be an aggregation error. This is not specific to Axios, but it falls under the AxiosError type
			return new InfisicalError(error.code);
		} else {
			return new InfisicalError("Request failed with unknown error");
		}
	}

	return new InfisicalError(error?.message || "An error occurred");
};
