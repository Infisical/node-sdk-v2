import { RawAxiosRequestConfig } from "axios";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type { ApiV1WorkspaceWorkspaceIdEnvironmentsPostRequest, ApiV1WorkspaceWorkspaceIdEnvironmentsPost200Response } from "../infisicalapi_client";
import { newInfisicalError } from "./errors";

export type CreateEnvironmentOptions = {
	projectId: string;
} & ApiV1WorkspaceWorkspaceIdEnvironmentsPostRequest;
export type CreateEnvironmentResult = ApiV1WorkspaceWorkspaceIdEnvironmentsPost200Response;

export default class EnvironmentsClient {
	#apiInstance: InfisicalApi;
	#requestOptions: RawAxiosRequestConfig | undefined;
	constructor(apiInstance: InfisicalApi, requestOptions: RawAxiosRequestConfig | undefined) {
		this.#apiInstance = apiInstance;
		this.#requestOptions = requestOptions;
	}

	create = async (options: CreateEnvironmentOptions): Promise<CreateEnvironmentResult["environment"]> => {
		try {
			const res = await this.#apiInstance.apiV1WorkspaceWorkspaceIdEnvironmentsPost(
				{
					workspaceId: options.projectId,
					apiV1WorkspaceWorkspaceIdEnvironmentsPostRequest: options
				},
				this.#requestOptions
			);
			return res.data.environment;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};
}
