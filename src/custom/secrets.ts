import { Configuration, DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type {
	DefaultApiApiV3SecretsRawGetRequest,
	DefaultApiApiV3SecretsRawSecretNameDeleteRequest,
	DefaultApiApiV3SecretsRawSecretNameGetRequest,
	DefaultApiApiV3SecretsRawSecretNamePatchRequest,
	DefaultApiApiV3SecretsRawSecretNamePostRequest
} from "../infisicalapi_client";

export default class SecretsClient {
	#apiInstance: InfisicalApi;
	constructor(private apiInstance: InfisicalApi) {
		this.#apiInstance = apiInstance;
	}

	listSecrets = async (options: DefaultApiApiV3SecretsRawGetRequest) => {
		const res = await this.#apiInstance.apiV3SecretsRawGet(options);
		return res.data;
	};

	getSecret = async (options: DefaultApiApiV3SecretsRawSecretNameGetRequest) => {
		const res = await this.#apiInstance.apiV3SecretsRawSecretNameGet(options);
		return res.data.secret;
	};

	updateSecret = async (
		secretName: DefaultApiApiV3SecretsRawSecretNamePatchRequest["secretName"],
		options: DefaultApiApiV3SecretsRawSecretNamePatchRequest["apiV3SecretsRawSecretNamePatchRequest"]
	) => {
		const res = await this.#apiInstance.apiV3SecretsRawSecretNamePatch({
			secretName,
			apiV3SecretsRawSecretNamePatchRequest: options
		});
		return res.data;
	};

	createSecret = async (
		secretName: DefaultApiApiV3SecretsRawSecretNamePostRequest["secretName"],
		options: DefaultApiApiV3SecretsRawSecretNamePostRequest["apiV3SecretsRawSecretNamePostRequest"]
	) => {
		const res = await this.#apiInstance.apiV3SecretsRawSecretNamePost({
			secretName,
			apiV3SecretsRawSecretNamePostRequest: options
		});
		return res.data;
	};

	deleteSecret = async (
		secretName: DefaultApiApiV3SecretsRawSecretNameDeleteRequest["secretName"],
		options: DefaultApiApiV3SecretsRawSecretNameDeleteRequest["apiV3SecretsRawSecretNameDeleteRequest"]
	) => {
		const res = await this.#apiInstance.apiV3SecretsRawSecretNameDelete({
			secretName,
			apiV3SecretsRawSecretNameDeleteRequest: options
		});
		return res.data;
	};
}
