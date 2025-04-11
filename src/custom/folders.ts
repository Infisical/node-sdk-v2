import { RawAxiosRequestConfig } from "axios";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type { ApiV1FoldersPostRequest, ApiV1FoldersPost200Response } from "../infisicalapi_client";
import { newInfisicalError } from "./errors";

export type CreateFolderOptions = {
	projectId: string;
} & Omit<ApiV1FoldersPostRequest, "workspaceId" | "directory">;
export type CreateFolderResult = ApiV1FoldersPost200Response;

export default class FoldersClient {
	#apiInstance: InfisicalApi;
	#requestOptions: RawAxiosRequestConfig | undefined;
	constructor(apiInstance: InfisicalApi, requestOptions: RawAxiosRequestConfig | undefined) {
		this.#apiInstance = apiInstance;
		this.#requestOptions = requestOptions;
	}

	create = async (options: CreateFolderOptions): Promise<CreateFolderResult["folder"]> => {
		try {
			const res = await this.#apiInstance.apiV1FoldersPost(
				{
					apiV1FoldersPostRequest: {
						...options,
						workspaceId: options.projectId
					}
				},
				this.#requestOptions
			);
			return res.data.folder;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};
}
