import { RawAxiosRequestConfig } from "axios";
import { DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type {
	ApiV3SecretsRawGet200Response,
	ApiV3SecretsRawSecretNameGet200Response,
	ApiV3SecretsRawSecretNamePost200Response,
	DefaultApiApiV3SecretsRawSecretNameDeleteRequest,
	DefaultApiApiV3SecretsRawSecretNamePatchRequest,
	DefaultApiApiV3SecretsRawSecretNamePostRequest
} from "../infisicalapi_client";
import { newInfisicalError } from "./errors";
import { getUniqueSecretsByKey } from "./util";

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

export type UpdateSecretOptions = Omit<DefaultApiApiV3SecretsRawSecretNamePatchRequest["apiV3SecretsRawSecretNamePatchRequest"], "workspaceId"> & {
	projectId: string;
};

export type CreateSecretOptions = Omit<DefaultApiApiV3SecretsRawSecretNamePostRequest["apiV3SecretsRawSecretNamePostRequest"], "workspaceId"> & {
	projectId: string;
};

export type DeleteSecretOptions = Omit<DefaultApiApiV3SecretsRawSecretNameDeleteRequest["apiV3SecretsRawSecretNameDeleteRequest"], "workspaceId"> & {
	projectId: string;
};

export type ListSecretsResult = ApiV3SecretsRawGet200Response;
export type GetSecretResult = ApiV3SecretsRawSecretNameGet200Response["secret"];
export type UpdateSecretResult = ApiV3SecretsRawSecretNamePost200Response;
export type CreateSecretResult = ApiV3SecretsRawSecretNamePost200Response;
export type DeleteSecretResult = ApiV3SecretsRawSecretNamePost200Response;

const convertBool = (value?: boolean) => (value ? "true" : "false");

export default class SecretsClient {
	#apiInstance: InfisicalApi;
	#requestOptions: RawAxiosRequestConfig | undefined;
	constructor(apiInstance: InfisicalApi, requestOptions: RawAxiosRequestConfig | undefined) {
		this.#apiInstance = apiInstance;
		this.#requestOptions = requestOptions;
	}

	listSecrets = async (options: ListSecretsOptions): Promise<ListSecretsResult> => {
		try {
			const res = await this.#apiInstance.apiV3SecretsRawGet(
				{
					viewSecretValue: convertBool(options.viewSecretValue),
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

	listSecretsWithImports = async (options: Omit<ListSecretsOptions, "includeImports">): Promise<ListSecretsResult["secrets"]> => {
		const res = await this.listSecrets({
			...options,
			includeImports: true
		});

		let { imports, secrets } = res;
		if (imports) {
			if (options.recursive) {
				secrets = getUniqueSecretsByKey(secrets);
			}

			for (const imp of imports) {
				for (const importedSecret of imp.secrets) {
					// CASE: We need to ensure that the imported values don't override the "base" secrets.
					// Priority order is:
					// Local/Preset variables -> Actual secrets -> Imported secrets (high->low)

					// Check if the secret already exists in the secrets list
					if (!secrets.find(s => s.secretKey === importedSecret.secretKey)) {
						secrets.push({
							...importedSecret,
							secretValueHidden: false,
							secretPath: imp.secretPath,
							// These fields are not returned by the API
							updatedAt: new Date().toISOString(),
							createdAt: new Date().toISOString(),
							tags: []
						});
					}
				}
			}
		}

		return secrets;
	};

	getSecret = async (options: GetSecretOptions): Promise<GetSecretResult> => {
		try {
			const res = await this.#apiInstance.apiV3SecretsRawSecretNameGet(
				{
					viewSecretValue: convertBool(options.viewSecretValue),
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

	updateSecret = async (
		secretName: DefaultApiApiV3SecretsRawSecretNamePatchRequest["secretName"],
		options: UpdateSecretOptions
	): Promise<UpdateSecretResult> => {
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

	createSecret = async (
		secretName: DefaultApiApiV3SecretsRawSecretNamePostRequest["secretName"],
		options: CreateSecretOptions
	): Promise<CreateSecretResult> => {
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

	deleteSecret = async (
		secretName: DefaultApiApiV3SecretsRawSecretNameDeleteRequest["secretName"],
		options: DeleteSecretOptions
	): Promise<DeleteSecretResult> => {
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
