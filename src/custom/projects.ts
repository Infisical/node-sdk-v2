import { RawAxiosRequestConfig } from "axios";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type {
	ApiV2WorkspacePost200Response,
	ApiV2WorkspacePostRequest,
	ApiV2WorkspaceProjectIdMembershipsPost200Response,
	ApiV2WorkspaceProjectIdMembershipsPostRequest
} from "../infisicalapi_client";
import { newInfisicalError } from "./errors";

export type CreateProjectOptions = ApiV2WorkspacePostRequest;
export type CreateProjectResult = ApiV2WorkspacePost200Response;

export type InviteMemberToProjectOptions = { projectId: string } & ApiV2WorkspaceProjectIdMembershipsPostRequest;
export type InviteMemberToProjectResult = ApiV2WorkspaceProjectIdMembershipsPost200Response;
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

	inviteMembers = async (options: InviteMemberToProjectOptions): Promise<InviteMemberToProjectResult["memberships"]> => {
		try {
			if (!options.usernames?.length && !options.emails?.length) {
				throw new Error("Either usernames or emails must be provided");
			}

			const res = await this.#apiInstance.apiV2WorkspaceProjectIdMembershipsPost(
				{
					projectId: options.projectId,
					apiV2WorkspaceProjectIdMembershipsPostRequest: options
				},
				this.#requestOptions
			);
			return res.data.memberships;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};
}
