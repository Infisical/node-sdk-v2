import { DynamicSecretProviders } from "../../custom/schemas";
import { TDynamicSecretProvider } from "../../custom/schemas";

export interface CreateDynamicSecretRequest {
  provider: TDynamicSecretProvider;
  defaultTTL: string;
  maxTTL: string;
  name: string;
  projectSlug: string;
  environmentSlug: string;
}

export interface DynamicSecret {
  id: string;
  name: string;
  defaultTTL: string;
  maxTTL: string;
  provider: {
    type: DynamicSecretProviders;
    inputs: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
  version: number;
  type: string;
  folderId: string;
  status: string;
  statusDetails: string;
  projectGatewayId: string;
  metadata: Record<string, any>;
}

export interface CreateDynamicSecretResponse {
  dynamicSecret: DynamicSecret;
}

export interface DeleteDynamicSecretRequest {
  environmentSlug: string;
  projectSlug: string;
  path?: string;
  isForced?: boolean;
}

export interface DeleteDynamicSecretResponse {
  dynamicSecret: DynamicSecret;
}

export interface CreateLeaseRequest {
  dynamicSecretName: string;
  environmentSlug: string;
  projectSlug: string;
  path?: string;
  ttl?: string;
}

export interface Lease {
  id: string;
  dynamicSecretId: string;
  data: Record<string, any>;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaseResponse {
  lease: Lease;
}

export interface DeleteLeaseRequest {
  environmentSlug: string;
  projectSlug: string;
  path?: string;
  isForced?: boolean;
}

export interface DeleteLeaseResponse {
  lease: Lease;
}

export interface RenewLeaseRequest {
  environmentSlug: string;
  projectSlug: string;
  path?: string;
  ttl?: string;
}

export interface RenewLeaseResponse {
  lease: Lease;
}

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
