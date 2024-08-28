import { Configuration, DefaultApi as InfisicalApi } from "./api/infisical";

import SecretsClient from "./custom/secrets";
import AuthClient from "./custom/auth";

// We need to do bind(this) because the authenticate method is a private method, and usually you can't call private methods from outside the class.

class InfisicalSDK {
	#apiInstance: InfisicalApi;
	// #accessToken: string; // No need to store the auth token here

	#secretsClient: SecretsClient;
	#authClient: AuthClient;

	constructor() {
		this.#apiInstance = new InfisicalApi();

		this.#authClient = new AuthClient(this.authenticate.bind(this));
		this.#secretsClient = new SecretsClient(this.#apiInstance);
	}

	private authenticate(accessToken: string) {
		this.#apiInstance = new InfisicalApi(new Configuration({ accessToken }));

		this.#secretsClient = new SecretsClient(this.#apiInstance);
		this.#authClient = new AuthClient(this.authenticate.bind(this));

		return this;
	}

	secrets = () => this.#secretsClient;
	auth = () => this.#authClient;
	// rest = () => this.#apiInstance;
}

export { InfisicalSDK };
