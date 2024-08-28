import { Configuration, DefaultApi as InfisicalApi } from "../api/infisical";
import type {
	DefaultApiApiV3SecretsRawGetRequest,
	DefaultApiApiV3SecretsRawSecretNameDeleteRequest,
	DefaultApiApiV3SecretsRawSecretNameGetRequest,
	DefaultApiApiV3SecretsRawSecretNamePatchRequest,
	DefaultApiApiV3SecretsRawSecretNamePostRequest
} from "../api/infisical";

export default class SecretsClient {
	#apiInstance: InfisicalApi;
	constructor(private apiInstance: InfisicalApi) {
		this.#apiInstance = apiInstance;
	}

	listSecrets = async (options: DefaultApiApiV3SecretsRawGetRequest) => {
		const res = await this.#apiInstance.apiV3SecretsRawGet(options);
		return res.data;
	};

	retrieveSecret = async (options: DefaultApiApiV3SecretsRawSecretNameGetRequest) => {
		const res = await this.#apiInstance.apiV3SecretsRawSecretNameGet(options);
		return res.data.secret;
	};

	updateSecret = async (options: DefaultApiApiV3SecretsRawSecretNamePatchRequest) => {
		const res = await this.#apiInstance.apiV3SecretsRawSecretNamePatch(options);
		return res.data;
	};

	createSecret = async (options: DefaultApiApiV3SecretsRawSecretNamePostRequest) => {
		const res = await this.#apiInstance.apiV3SecretsRawSecretNamePost(options);
		return res.data;
	};

	deleteSecret = async (options: DefaultApiApiV3SecretsRawSecretNameDeleteRequest) => {
		const res = await this.#apiInstance.apiV3SecretsRawSecretNameDelete(options);
		return res.data;
	};
}
