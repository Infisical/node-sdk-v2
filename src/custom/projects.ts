import { RawAxiosRequestConfig } from "axios";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type { ApiV2WorkspacePost200Response, ApiV2WorkspacePostRequest } from "../infisicalapi_client";
import { newInfisicalError } from "./errors";

export type CreateProjectOptions = ApiV2WorkspacePostRequest;
export type CreateProjectResult = ApiV2WorkspacePost200Response;

export default class ProjectsClient {
	#apiInstance: InfisicalApi;
	#requestOptions: RawAxiosRequestConfig | undefined;
	constructor(apiInstance: InfisicalApi, requestOptions: RawAxiosRequestConfig | undefined) {
		this.#apiInstance = apiInstance;
		this.#requestOptions = requestOptions;
	}

	create = async (options: CreateProjectOptions): Promise<CreateProjectResult["project"]> => {
		try {
			const res = await this.#apiInstance.apiV2WorkspacePost(
				{
					apiV2WorkspacePostRequest: options
				},
				this.#requestOptions
			);
			return res.data.project;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};
}
