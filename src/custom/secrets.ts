import { SecretsApi } from "../api/endpoints/secrets";
import { Secret } from "../api/types";
import { newInfisicalError } from "./errors";

type SecretType = "shared" | "personal";

type ListSecretsOptions = {
  environment: string;
  projectId: string;
  expandSecretReferences?: boolean;
  includeImports?: boolean;
  recursive?: boolean;
  secretPath?: string;
  tagSlugs?: string[];
  viewSecretValue?: boolean;
};

type GetSecretOptions = {
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

type BaseSecretOptions = {
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

const convertBool = (value?: boolean) => (value ? "true" : "false");

const defaultBoolean = (value?: boolean, defaultValue: boolean = false) => {
  if (value === undefined) {
    return defaultValue;
  }
  return value;
};

export default class SecretsClient {
  constructor(private apiClient: SecretsApi) {}

  listSecrets = async (options: ListSecretsOptions) => {
    try {
      return await this.apiClient.listSecrets({
        workspaceId: options.projectId,
        environment: options.environment,
        expandSecretReferences: convertBool(
          defaultBoolean(options.expandSecretReferences, true)
        ),
        includeImports: convertBool(options.includeImports),
        recursive: convertBool(options.recursive),
        secretPath: options.secretPath,
        tagSlugs: options.tagSlugs ? options.tagSlugs.join(",") : undefined,
        viewSecretValue: convertBool(options.viewSecretValue ?? true),
      });
    } catch (err) {
      throw newInfisicalError(err);
    }
  };

  listSecretsWithImports = async (
    options: Omit<ListSecretsOptions, "includeImports">
  ) => {
    const res = await this.listSecrets({
      ...options,
      includeImports: true,
    });

    let { imports, secrets } = res;
    if (imports) {
      for (const imp of imports) {
        for (const importedSecret of imp.secrets) {
          if (!secrets.find((s) => s.secretKey === importedSecret.secretKey)) {
            secrets.push({
              ...importedSecret,
              secretPath: imp.secretPath,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: [],
            });
          }
        }
      }
    }

    return secrets;
  };

  getSecret = async (options: GetSecretOptions) => {
    try {
      const res = await this.apiClient.getSecret({
        secretName: options.secretName,
        workspaceId: options.projectId,
        environment: options.environment,
        expandSecretReferences: convertBool(
          defaultBoolean(options.expandSecretReferences, true)
        ),
        includeImports: convertBool(options.includeImports),
        secretPath: options.secretPath,
        type: options.type,
        version: options.version,
        viewSecretValue: convertBool(options.viewSecretValue ?? true),
      });
      return res.secret;
    } catch (err) {
      throw newInfisicalError(err);
    }
  };

  updateSecret = async (secretName: string, options: UpdateSecretOptions) => {
    try {
      return await this.apiClient.updateSecret(secretName, {
        workspaceId: options.projectId,
        environment: options.environment,
        secretValue: options.secretValue,
        newSecretName: options.newSecretName,
        secretComment: options.secretComment,
        secretPath: options.secretPath,
        secretReminderNote: options.secretReminderNote,
        secretReminderRepeatDays: options.secretReminderRepeatDays,
        skipMultilineEncoding: options.skipMultilineEncoding,
        tagIds: options.tagIds,
        type: options.type,
        metadata: options.metadata,
      });
    } catch (err) {
      throw newInfisicalError(err);
    }
  };

  createSecret = async (secretName: string, options: CreateSecretOptions) => {
    try {
      return await this.apiClient.createSecret(secretName, {
        workspaceId: options.projectId,
        environment: options.environment,
        secretValue: options.secretValue,
        secretComment: options.secretComment,
        secretPath: options.secretPath,
        secretReminderNote: options.secretReminderNote,
        secretReminderRepeatDays: options.secretReminderRepeatDays,
        skipMultilineEncoding: options.skipMultilineEncoding,
        tagIds: options.tagIds,
        type: options.type,
      });
    } catch (err) {
      throw newInfisicalError(err);
    }
  };

  deleteSecret = async (secretName: string, options: DeleteSecretOptions) => {
    try {
      return await this.apiClient.deleteSecret(secretName, {
        workspaceId: options.projectId,
        environment: options.environment,
        secretPath: options.secretPath,
        type: options.type,
      });
    } catch (err) {
      throw newInfisicalError(err);
    }
  };
}
