import { ApiClient } from "../base";
import {
  ListSecretsRequest,
  ListSecretsResponse,
  GetSecretRequest,
  GetSecretResponse,
  CreateSecretRequest,
  CreateSecretResponse,
  UpdateSecretRequest,
  UpdateSecretResponse,
  DeleteSecretRequest,
  DeleteSecretResponse,
} from "../types";

export class SecretsApi {
  constructor(private apiClient: ApiClient) {}

  async listSecrets(params: ListSecretsRequest): Promise<ListSecretsResponse> {
    return this.apiClient.get<ListSecretsResponse>("/api/v3/secrets/raw", {
      params,
    });
  }

  async getSecret(params: GetSecretRequest): Promise<GetSecretResponse> {
    const { secretName, ...queryParams } = params;
    return this.apiClient.get<GetSecretResponse>(
      `/api/v3/secrets/raw/${encodeURIComponent(secretName)}`,
      { params: queryParams }
    );
  }

  async createSecret(
    secretName: string,
    data: CreateSecretRequest
  ): Promise<CreateSecretResponse> {
    return this.apiClient.post<CreateSecretResponse>(
      `/api/v3/secrets/raw/${encodeURIComponent(secretName)}`,
      data
    );
  }

  async updateSecret(
    secretName: string,
    data: UpdateSecretRequest
  ): Promise<UpdateSecretResponse> {
    return this.apiClient.patch<UpdateSecretResponse>(
      `/api/v3/secrets/raw/${encodeURIComponent(secretName)}`,
      data
    );
  }

  async deleteSecret(
    secretName: string,
    data: DeleteSecretRequest
  ): Promise<DeleteSecretResponse> {
    return this.apiClient.delete<DeleteSecretResponse>(
      `/api/v3/secrets/raw/${encodeURIComponent(secretName)}`,
      { data }
    );
  }
}
