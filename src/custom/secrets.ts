import { RawAxiosRequestConfig } from "axios";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type {
	DefaultApiApiV3SecretsRawSecretNameDeleteRequest,
	DefaultApiApiV3SecretsRawSecretNamePatchRequest,
	DefaultApiApiV3SecretsRawSecretNamePostRequest
} from "../infisicalapi_client";
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
};

type UpdateSecretOptions = Omit<DefaultApiApiV3SecretsRawSecretNamePatchRequest["apiV3SecretsRawSecretNamePatchRequest"], "workspaceId"> & {
	projectId: string;
};

type CreateSecretOptions = Omit<DefaultApiApiV3SecretsRawSecretNamePostRequest["apiV3SecretsRawSecretNamePostRequest"], "workspaceId"> & {
	projectId: string;
};

type DeleteSecretOptions = Omit<DefaultApiApiV3SecretsRawSecretNameDeleteRequest["apiV3SecretsRawSecretNameDeleteRequest"], "workspaceId"> & {
	projectId: string;
};

const convertBool = (value: boolean | undefined) => (value ? "true" : "false");

export default class SecretsClient {
	#apiInstance: InfisicalApi;
	#requestOptions: RawAxiosRequestConfig | undefined;
	constructor(apiInstance: InfisicalApi, requestOptions: RawAxiosRequestConfig | undefined) {
		this.#apiInstance = apiInstance;
		this.#requestOptions = requestOptions;
	}

	listSecrets = async (options: ListSecretsOptions) => {
		try {
			const res = await this.#apiInstance.apiV3SecretsRawGet(
				{
					environment: options.environment,
					workspaceId: options.projectId,
					expandSecretReferences: convertBool(options.expandSecretReferences),
					includeImports: convertBool(options.includeImports),
					recursive: convertBool(options.recursive),
					secretPath: options.secretPath,
					tagSlugs: options.tagSlugs ? options.tagSlugs.join(",") : undefined
				},
				this.#requestOptions
			);
			return res.data;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};

	getSecret = async (options: GetSecretOptions) => {
		try {
			const res = await this.#apiInstance.apiV3SecretsRawSecretNameGet(
				{
					environment: options.environment,
					secretName: options.secretName,
					workspaceId: options.projectId,
					expandSecretReferences: convertBool(options.expandSecretReferences),
					includeImports: convertBool(options.includeImports),
					secretPath: options.secretPath,
					type: options.type,
					version: options.version
				},
				this.#requestOptions
			);
			return res.data.secret;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};

	updateSecret = async (secretName: DefaultApiApiV3SecretsRawSecretNamePatchRequest["secretName"], options: UpdateSecretOptions) => {
		try {
			const res = await this.#apiInstance.apiV3SecretsRawSecretNamePatch(
				{
					secretName,
					apiV3SecretsRawSecretNamePatchRequest: {
						...options,
						workspaceId: options.projectId
					}
				},
				this.#requestOptions
			);
			return res.data;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};

	createSecret = async (secretName: DefaultApiApiV3SecretsRawSecretNamePostRequest["secretName"], options: CreateSecretOptions) => {
		try {
			const res = await this.#apiInstance.apiV3SecretsRawSecretNamePost(
				{
					secretName,
					apiV3SecretsRawSecretNamePostRequest: {
						...options,
						workspaceId: options.projectId
					}
				},
				this.#requestOptions
			);
			return res.data;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};

	deleteSecret = async (secretName: DefaultApiApiV3SecretsRawSecretNameDeleteRequest["secretName"], options: DeleteSecretOptions) => {
		try {
			const res = await this.#apiInstance.apiV3SecretsRawSecretNameDelete(
				{
					secretName,
					apiV3SecretsRawSecretNameDeleteRequest: {
						...options,
						workspaceId: options.projectId
					}
				},
				this.#requestOptions
			);
			return res.data;
		} catch (err) {
			throw newInfisicalError(err);
		}
	};
}
