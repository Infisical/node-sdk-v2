import { IdentitiesApi } from "../api/endpoints/identities";
import { newInfisicalError } from "./errors";

export default class IdentitiesClient {
  constructor(private apiClient: IdentitiesApi) {}

  getIdentityById = async (identityId: string) => {
    try {
      const res = await this.apiClient.getIdentityById(identityId);
      return res.identity;
    } catch (err) {
      throw newInfisicalError(err);
    }
  };
}
