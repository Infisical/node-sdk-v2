import { ApiClient } from "../base";
import { GetIdentityByIdResponse } from "../types";

export class IdentitiesApi {
  constructor(private apiClient: ApiClient) {}

  async getIdentityById(identityId: string): Promise<GetIdentityByIdResponse> {
    return this.apiClient.get<GetIdentityByIdResponse>(
      `/api/v1/identities/${identityId}`
    );
  }
}
