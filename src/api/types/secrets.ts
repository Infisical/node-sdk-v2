export enum SecretType {
	Shared = "shared",
	Personal = "personal"
}

export interface Secret {
  id: string;
  workspaceId: string;
  environment: string;
  secretKey: string;
  secretValue: string;
  secretComment?: string;
  secretPath?: string;
  secretValueHidden: boolean;
  secretReminderNote?: string;
  secretReminderRepeatDays?: number;
  skipMultilineEncoding?: boolean;
  folderId?: string;
  actor?: {
    actorId?: string;
    name?: string;
    actorType?: string;
    membershipId?: string;
  }
  isRotatedSecret: boolean;
  rotationId?: string;
  secretMetadata?: Record<string, any>;
  type: SecretType;
  createdAt: string;
  updatedAt: string;
  version: number;
  tags: string[];
}

export interface ListSecretsRequest {
  workspaceId: string;
  environment: string;
  expandSecretReferences?: string;
  includeImports?: string;
  recursive?: string;
  secretPath?: string;
  tagSlugs?: string;
  viewSecretValue?: string;
}

export interface ListSecretsResponse {
  secrets: Secret[];
  imports?: Array<{
    secretPath: string;
    secrets: Secret[];
    folderId?: string;
    environment: string;
  }>;
}

export interface GetSecretRequest {
  secretName: string;
  workspaceId: string;
  environment: string;
  expandSecretReferences?: string;
  includeImports?: string;
  secretPath?: string;
  type?: SecretType;
  version?: number;
  viewSecretValue?: string;
}

export interface GetSecretResponse {
  secret: Secret;
}

export interface CreateSecretRequest {
  workspaceId: string;
  environment: string;
  secretValue: string;
  secretComment?: string;
  secretPath?: string;
  secretReminderNote?: string;
  secretReminderRepeatDays?: number;
  skipMultilineEncoding?: boolean;
  tagIds?: string[];
  type?: SecretType;
}

export interface UpdateSecretRequest {
  workspaceId: string;
  environment: string;
  secretValue?: string;
  newSecretName?: string;
  secretComment?: string;
  secretPath?: string;
  secretReminderNote?: string;
  secretReminderRepeatDays?: number;
  skipMultilineEncoding?: boolean;
  tagIds?: string[];
  type?: SecretType;
  metadata?: Record<string, any>;
}

export interface DeleteSecretRequest {
  workspaceId: string;
  environment: string;
  secretPath?: string;
  type?: SecretType;
}

export type ListSecretsOptions = {
  environment: string;
  projectId: string;
  expandSecretReferences?: boolean;
  attachToProcessEnv?: boolean;
  includeImports?: boolean;
  recursive?: boolean;
  secretPath?: string;
  tagSlugs?: string[];
  viewSecretValue?: boolean;
};

export type GetSecretOptions = {
  environment: string;
  secretName: string;
  expandSecretReferences?: boolean;
  includeImports?: boolean;
  secretPath?: string;
  type?: SecretType;
  version?: number;
  projectId: string;
  viewSecretValue?: boolean;
};

export type BaseSecretOptions = {
  environment: string;
  projectId: string;
  secretComment?: string;
  secretPath?: string;
  secretReminderNote?: string;
  secretReminderRepeatDays?: number;
  skipMultilineEncoding?: boolean;
  tagIds?: string[];
  type?: SecretType;
  metadata?: Record<string, any>;
  secretMetadata?: Record<string, any>[];
};

export type UpdateSecretOptions = {
  secretValue?: string;
  newSecretName?: string;
} & BaseSecretOptions;

export type CreateSecretOptions = {
  secretValue: string;
} & BaseSecretOptions;

export type DeleteSecretOptions = {
  environment: string;
  projectId: string;
  secretPath?: string;
  type?: SecretType;
};
