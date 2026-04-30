import { ApiClient } from "../base";
import {
  CreateProjectRequest,
  CreateProjectResponse,
  InviteMembersRequest,
  InviteMembersResponse,
  ListProjectsResponse,
} from "../types";

export class ProjectsApi {
  constructor(private apiClient: ApiClient) {}

  async listProjects(): Promise<ListProjectsResponse> {
    return this.apiClient.get<ListProjectsResponse>("/api/v1/projects");
  }

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
      data
    );
  }
}
