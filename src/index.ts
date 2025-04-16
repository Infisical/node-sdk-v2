import { Configuration, DefaultApi as InfisicalApi } from "./infisicalapi_client";
import { DefaultApiApiV1DynamicSecretsLeasesPostRequest } from "./infisicalapi_client";
import SecretsClient from "./custom/secrets";
import AuthClient from "./custom/auth";
import axios, { AxiosError, AxiosInstance, RawAxiosRequestConfig } from "axios";
import DynamicSecretsClient from "./custom/dynamic-secrets";

import * as ApiClient from "./infisicalapi_client";
import EnvironmentsClient from "./custom/environments";
import ProjectsClient from "./custom/projects";
import FoldersClient from "./custom/folders";

declare module "axios" {
	interface AxiosRequestConfig {
		_retryCount?: number;
	}
}

const buildRestClient = (apiClient: InfisicalApi, requestOptions?: RawAxiosRequestConfig) => {
	return {
		// Add more as we go
		apiV1DynamicSecretsLeasesPost: (options: DefaultApiApiV1DynamicSecretsLeasesPostRequest) =>
			apiClient.apiV1DynamicSecretsLeasesPost(options, requestOptions)
	};
};

const setupAxiosRetry = () => {
	const axiosInstance = axios.create();
	const maxRetries = 4;

	const initialRetryDelay = 1000;
	const backoffFactor = 2;

	axiosInstance.interceptors.response.use(null, (error: AxiosError) => {
		const config = error?.config;

		if (!config) {
			return Promise.reject(error);
		}

		if (!config._retryCount) config._retryCount = 0;

		// handle rate limits and network errors
		if ((error.response?.status === 429 || error.response?.status === undefined) && config && config._retryCount! < maxRetries) {
			config._retryCount!++;
			const baseDelay = initialRetryDelay * Math.pow(backoffFactor, config._retryCount! - 1);
			const jitter = baseDelay * 0.2; // 20% +/- jitter
			const exponentialDelay = Math.min(baseDelay + (Math.random() * 2 - 1) * jitter);

			return new Promise(resolve => {
				setTimeout(() => {
					resolve(axiosInstance(config));
				}, exponentialDelay);
			});
		}

		return Promise.reject(error);
	});

	return axiosInstance;
};

// We need to do bind(this) because the authenticate method is a private method, and usually you can't call private methods from outside the class.
type InfisicalSDKOptions = {
	siteUrl?: string;
};

class InfisicalSDK {
	#apiInstance: InfisicalApi;

	#requestOptions: RawAxiosRequestConfig | undefined;
	#secretsClient: SecretsClient;
	#dynamicSecretsClient: DynamicSecretsClient;
	#environmentsClient: EnvironmentsClient;
	#projectsClient: ProjectsClient;
	#foldersClient: FoldersClient;
	#authClient: AuthClient;
	#basePath: string;
	axiosInstance: AxiosInstance;

	constructor(options?: InfisicalSDKOptions) {
		this.#basePath = options?.siteUrl || "https://app.infisical.com";
		this.axiosInstance = setupAxiosRetry();

		this.#apiInstance = new InfisicalApi(
			new Configuration({
				basePath: this.#basePath
			}),
			undefined,
			this.axiosInstance
		);

		this.#authClient = new AuthClient(this.authenticate.bind(this), this.#apiInstance);
		this.#dynamicSecretsClient = new DynamicSecretsClient(this.#apiInstance, this.#requestOptions);
		this.#secretsClient = new SecretsClient(this.#apiInstance, this.#requestOptions);
		this.#environmentsClient = new EnvironmentsClient(this.#apiInstance, this.#requestOptions);
		this.#projectsClient = new ProjectsClient(this.#apiInstance, this.#requestOptions);
		this.#foldersClient = new FoldersClient(this.#apiInstance, this.#requestOptions);
		this.rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);
	}

	private authenticate(accessToken: string) {
		this.#apiInstance = new InfisicalApi(
			new Configuration({
				basePath: this.#basePath,
				accessToken
			}),
			undefined,
			this.axiosInstance
		);

		this.#requestOptions = {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		};

		this.rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);
		this.#secretsClient = new SecretsClient(this.#apiInstance, this.#requestOptions);
		this.#dynamicSecretsClient = new DynamicSecretsClient(this.#apiInstance, this.#requestOptions);
		this.#authClient = new AuthClient(this.authenticate.bind(this), this.#apiInstance, accessToken);
		this.#environmentsClient = new EnvironmentsClient(this.#apiInstance, this.#requestOptions);
		this.#projectsClient = new ProjectsClient(this.#apiInstance, this.#requestOptions);
		this.#foldersClient = new FoldersClient(this.#apiInstance, this.#requestOptions);

		return this;
	}

	secrets = () => this.#secretsClient;
	environments = () => this.#environmentsClient;
	projects = () => this.#projectsClient;
	folders = () => this.#foldersClient;
	dynamicSecrets = () => this.#dynamicSecretsClient;
	auth = () => this.#authClient;
	rest = () => buildRestClient(this.#apiInstance, this.#requestOptions);
}

export { InfisicalSDK, ApiClient };
export { TDynamicSecretProvider, DynamicSecretProviders } from "./custom/schemas";
export type * from "./custom/secrets";
export type * from "./custom/dynamic-secrets";
