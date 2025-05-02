import { ApiClient } from "../base";
import {
  CreateProjectRequest,
  CreateProjectResponse,
  InviteMembersRequest,
  InviteMembersResponse,
} from "../types";

export class ProjectsApi {
  constructor(private apiClient: ApiClient) {}

  async create(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    return this.apiClient.post<CreateProjectResponse>(
      "/api/v2/workspace",
      data
    );
  }

  async inviteMembers(
    data: InviteMembersRequest
  ): Promise<InviteMembersResponse> {
    return this.apiClient.post<InviteMembersResponse>(
      `/api/v2/workspace/${data.projectId}/memberships`,
      {
        emails: data.emails,
        usernames: data.usernames,
        roleSlugs: data.roleSlugs,
      }
    );
  }
}
