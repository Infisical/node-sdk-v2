export interface Secret {
  id: string;
  workspaceId: string;
  environment: string;
  secretKey: string;
  secretValue: string;
  secretComment?: string;
  secretPath?: string;
  type: "shared" | "personal";
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
  }>;
}

export interface GetSecretRequest {
  secretName: string;
  workspaceId: string;
  environment: string;
  expandSecretReferences?: string;
  includeImports?: string;
  secretPath?: string;
  type?: "shared" | "personal";
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
  type?: "shared" | "personal";
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
  type?: "shared" | "personal";
  metadata?: Record<string, any>;
}

export interface DeleteSecretRequest {
  workspaceId: string;
  environment: string;
  secretPath?: string;
  type?: "shared" | "personal";
}
