import { EnvironmentsApi } from "../api/endpoints/environments";
import { newInfisicalError } from "./errors";

export type CreateEnvironmentOptions = {
  name: string;
  projectId: string;
  slug: string;
  position?: number;
};

export default class EnvironmentsClient {
  constructor(private apiClient: EnvironmentsApi) {}

  create = async (options: CreateEnvironmentOptions) => {
    try {
      const res = await this.apiClient.create(options);
      return res.environment;
    } catch (err) {
      throw newInfisicalError(err);
    }
  };
}
