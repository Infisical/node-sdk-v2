import { DynamicSecretsApi } from "../api/endpoints/dynamic-secrets";
import { TDynamicSecretProvider } from "./schemas/dynamic-secrets";
import { newInfisicalError } from "./errors";

export type CreateDynamicSecretOptions = {
  provider: TDynamicSecretProvider;
  defaultTTL: string;
  maxTTL: string;
  name: string;
  projectSlug: string;
  environmentSlug: string;
  path?: string;
  metadata?: Record<string, any>;
};

export type DeleteDynamicSecretOptions = {
  environmentSlug: string;
  projectSlug: string;
  path?: string;
  isForced?: boolean;
};

export type CreateDynamicSecretLeaseOptions = {
  dynamicSecretName: string;
  environmentSlug: string;
  projectSlug: string;
  path?: string;
  ttl?: string;
};

export type DeleteDynamicSecretLeaseOptions = {
  environmentSlug: string;
  projectSlug: string;
  path?: string;
  isForced?: boolean;
};

export type RenewDynamicSecretLeaseOptions = {
  environmentSlug: string;
  projectSlug: string;
  path?: string;
  ttl?: string;
};

export default class DynamicSecretsClient {
  constructor(private apiClient: DynamicSecretsApi) {}

  async create(options: CreateDynamicSecretOptions) {
    try {
      const res = await this.apiClient.create(options);
      return res.dynamicSecret;
    } catch (err) {
      throw newInfisicalError(err);
    }
  }

  async delete(dynamicSecretName: string, options: DeleteDynamicSecretOptions) {
    try {
      const res = await this.apiClient.delete(dynamicSecretName, options);
      return res.dynamicSecret;
    } catch (err) {
      throw newInfisicalError(err);
    }
  }

  leases = {
    create: async (options: CreateDynamicSecretLeaseOptions) => {
      try {
        const res = await this.apiClient.leases.create(options);
        return res;
      } catch (err) {
        throw newInfisicalError(err);
      }
    },

    delete: async (
      leaseId: string,
      options: DeleteDynamicSecretLeaseOptions
    ) => {
      try {
        const res = await this.apiClient.leases.delete(leaseId, options);
        return res;
      } catch (err) {
        throw newInfisicalError(err);
      }
    },

    renew: async (leaseId: string, options: RenewDynamicSecretLeaseOptions) => {
      try {
        const res = await this.apiClient.leases.renew(leaseId, options);
        return res;
      } catch (err) {
        throw newInfisicalError(err);
      }
    },
  };
}
