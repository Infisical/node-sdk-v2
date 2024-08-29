import { Configuration, DefaultApi as InfisicalApi } from "./infisicalapi_client";

import SecretsClient from "./custom/secrets";
import AuthClient from "./custom/auth";

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

	constructor(options?: InfisicalSDKOptions) {
		this.#basePath = options?.siteUrl || "https://app.infisical.com";
		this.#apiInstance = new InfisicalApi(new Configuration({ basePath: this.#basePath }));

		this.#authClient = new AuthClient(this.authenticate.bind(this));
		this.#secretsClient = new SecretsClient(this.#apiInstance);
	}

	private authenticate(accessToken: string) {
		this.#apiInstance = new InfisicalApi(new Configuration({ accessToken, basePath: this.#basePath }));

		this.#secretsClient = new SecretsClient(this.#apiInstance);
		this.#authClient = new AuthClient(this.authenticate.bind(this));

		return this;
	}

	secrets = () => this.#secretsClient;
	auth = () => this.#authClient;
	rest = () => this.#apiInstance;
}

export { InfisicalSDK };
