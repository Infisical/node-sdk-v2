import { ApiClient } from "../base";
import { CreateEnvironmentRequest, CreateEnvironmentResponse } from "../types";

export class EnvironmentsApi {
  constructor(private apiClient: ApiClient) {}

  async create(
    data: CreateEnvironmentRequest
  ): Promise<CreateEnvironmentResponse> {
    return this.apiClient.post<CreateEnvironmentResponse>(
      `/api/v1/workspace/${data.projectId}/environments`,
      data
    );
  }
}
