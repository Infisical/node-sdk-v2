import { EnvironmentsApi } from "../api/endpoints/environments";
import { newInfisicalError } from "./errors";
import { CreateEnvironmentOptions } from "../api/types/environments";

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
