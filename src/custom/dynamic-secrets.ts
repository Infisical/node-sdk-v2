import { RawAxiosRequestConfig } from "axios";
import { Configuration, DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type {
	DefaultApiApiV1DynamicSecretsLeasesLeaseIdDeleteRequest,
	DefaultApiApiV1DynamicSecretsLeasesLeaseIdRenewPostRequest,
	DefaultApiApiV1DynamicSecretsLeasesPostRequest,
	DefaultApiApiV1DynamicSecretsNameDeleteRequest,
	DefaultApiApiV1DynamicSecretsPostRequest
} from "../infisicalapi_client";

import type { TDynamicSecretProvider } from "./schemas/dynamic-secrets";

type CreateDynamicSecretOptions = Omit<DefaultApiApiV1DynamicSecretsPostRequest["apiV1DynamicSecretsPostRequest"], "provider"> & {
	provider: TDynamicSecretProvider;
};

export default class DynamicSecretsClient {
	#apiInstance: InfisicalApi;
	#requestOptions: RawAxiosRequestConfig | undefined;
	constructor(apiInstance: InfisicalApi, requestOptions: RawAxiosRequestConfig | undefined) {
		this.#apiInstance = apiInstance;
		this.#requestOptions = requestOptions;
	}

	async create(options: CreateDynamicSecretOptions) {
		const res = await this.#apiInstance.apiV1DynamicSecretsPost(
			{
				// @ts-ignore
				apiV1DynamicSecretsPostRequest: options as DefaultApiApiV1DynamicSecretsPostRequest["apiV1DynamicSecretsPostRequest"]
			},
			this.#requestOptions
		);

		return res.data.dynamicSecret;
	}

	async delete(dynamicSecretName: string, options: DefaultApiApiV1DynamicSecretsNameDeleteRequest["apiV1DynamicSecretsNameDeleteRequest"]) {
		const res = await this.#apiInstance.apiV1DynamicSecretsNameDelete(
			{
				name: dynamicSecretName,
				apiV1DynamicSecretsNameDeleteRequest: options
			},
			this.#requestOptions
		);

		return res.data.dynamicSecret;
	}

	leases = {
		create: async (options: DefaultApiApiV1DynamicSecretsLeasesPostRequest["apiV1DynamicSecretsLeasesPostRequest"]) => {
			const res = await this.#apiInstance.apiV1DynamicSecretsLeasesPost(
				{
					apiV1DynamicSecretsLeasesPostRequest: options
				},
				this.#requestOptions
			);

			return res.data;
		},
		delete: async (
			leaseId: string,
			options: DefaultApiApiV1DynamicSecretsLeasesLeaseIdDeleteRequest["apiV1DynamicSecretsLeasesLeaseIdDeleteRequest"]
		) => {
			const res = await this.#apiInstance.apiV1DynamicSecretsLeasesLeaseIdDelete(
				{
					leaseId: leaseId,
					apiV1DynamicSecretsLeasesLeaseIdDeleteRequest: options
				},
				this.#requestOptions
			);

			return res.data;
		},

		renew: async (
			leaseId: string,
			options: DefaultApiApiV1DynamicSecretsLeasesLeaseIdRenewPostRequest["apiV1DynamicSecretsLeasesLeaseIdRenewPostRequest"]
		) => {
			const res = await this.#apiInstance.apiV1DynamicSecretsLeasesLeaseIdRenewPost(
				{
					leaseId: leaseId,
					apiV1DynamicSecretsLeasesLeaseIdRenewPostRequest: options
				},
				this.#requestOptions
			);

			return res.data;
		}
	};
}
