import { Configuration, DefaultApi as InfisicalApi } from "./infisicalapi_client";
import { DefaultApiApiV1DynamicSecretsLeasesPostRequest } from "./infisicalapi_client";
import SecretsClient from "./custom/secrets";
import AuthClient from "./custom/auth";

const buildRestClient = (apiClient: InfisicalApi, accessToken: string) => {
	const defaultOptions = {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	};

	return {
		apiV1DynamicSecretsLeasesPost: (options: DefaultApiApiV1DynamicSecretsLeasesPostRequest) =>
			apiClient.apiV1DynamicSecretsLeasesPost(options, defaultOptions)
	};
};

// We need to do bind(this) because the authenticate method is a private method, and usually you can't call private methods from outside the class.
type InfisicalSDKOptions = {
	siteUrl?: string;
};

class InfisicalSDK {
	#apiInstance: InfisicalApi;
	// #accessToken: string; // No need to store the auth token here

	#secretsClient: SecretsClient;
	#authClient: AuthClient;
	#basePath: string;
	#accessToken: string;

	constructor(options?: InfisicalSDKOptions) {
		this.#basePath = options?.siteUrl || "https://app.infisical.com";
		this.#accessToken = "";

		this.#apiInstance = new InfisicalApi(
			new Configuration({
				basePath: this.#basePath
			})
		);

		this.#authClient = new AuthClient(this.authenticate.bind(this), this.#apiInstance);
		this.#secretsClient = new SecretsClient(this.#apiInstance);
		this.rest = () => buildRestClient(this.#apiInstance, this.#accessToken);
	}

	private authenticate(accessToken: string) {
		this.#apiInstance = new InfisicalApi(
			new Configuration({
				basePath: this.#basePath,
				accessToken
			})
		);

		this.#accessToken = accessToken;
		this.#secretsClient = new SecretsClient(this.#apiInstance);
		this.#authClient = new AuthClient(this.authenticate.bind(this), this.#apiInstance);
		this.rest = () => buildRestClient(this.#apiInstance, this.#accessToken);

		return this;
	}

	secrets = () => this.#secretsClient;
	auth = () => this.#authClient;
	rest = () => buildRestClient(this.#apiInstance, this.#accessToken);
}

export { InfisicalSDK };
