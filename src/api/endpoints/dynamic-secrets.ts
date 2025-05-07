import { ApiClient } from "../base";
import {
  CreateDynamicSecretRequest,
  CreateDynamicSecretResponse,
  DeleteDynamicSecretRequest,
  DeleteDynamicSecretResponse,
  CreateLeaseRequest,
  CreateLeaseResponse,
  DeleteLeaseRequest,
  DeleteLeaseResponse,
  RenewLeaseRequest,
  RenewLeaseResponse,
} from "../types";

export class DynamicSecretsApi {
  constructor(private apiClient: ApiClient) {}

  async create(
    data: CreateDynamicSecretRequest
  ): Promise<CreateDynamicSecretResponse> {
    return this.apiClient.post<CreateDynamicSecretResponse>(
      "/api/v1/dynamic-secrets",
      data
    );
  }

  async delete(
    secretName: string,
    data: DeleteDynamicSecretRequest
  ): Promise<DeleteDynamicSecretResponse> {
    return this.apiClient.delete<DeleteDynamicSecretResponse>(
      `/api/v1/dynamic-secrets/${encodeURIComponent(secretName)}`,
      { data }
    );
  }

  leases = {
    create: async (data: CreateLeaseRequest): Promise<CreateLeaseResponse> => {
      return this.apiClient.post<CreateLeaseResponse>(
        "/api/v1/dynamic-secrets/leases",
        data
      );
    },

    delete: async (
      leaseId: string,
      data: DeleteLeaseRequest
    ): Promise<DeleteLeaseResponse> => {
      return this.apiClient.delete<DeleteLeaseResponse>(
        `/api/v1/dynamic-secrets/leases/${leaseId}`,
        { data }
      );
    },

    renew: async (
      leaseId: string,
      data: RenewLeaseRequest
    ): Promise<RenewLeaseResponse> => {
      return this.apiClient.post<RenewLeaseResponse>(
        `/api/v1/dynamic-secrets/leases/${leaseId}/renew`,
        data
      );
    },
  };
}
