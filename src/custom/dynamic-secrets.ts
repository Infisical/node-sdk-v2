import { RawAxiosRequestConfig } from "axios";
import { Configuration, DefaultApi as InfisicalApi } from "../infisicalapi_client";
import type {
	ApiV1DynamicSecretsGet200ResponseDynamicSecretsInner,
	ApiV1DynamicSecretsLeasesLeaseIdDelete200Response,
	ApiV1DynamicSecretsLeasesPost200Response,
	DefaultApiApiV1DynamicSecretsLeasesLeaseIdDeleteRequest,
	DefaultApiApiV1DynamicSecretsLeasesLeaseIdRenewPostRequest,
	DefaultApiApiV1DynamicSecretsLeasesPostRequest,
	DefaultApiApiV1DynamicSecretsNameDeleteRequest,
	DefaultApiApiV1DynamicSecretsPostRequest
} from "../infisicalapi_client";

import type { TDynamicSecretProvider } from "./schemas/dynamic-secrets";
import { newInfisicalError } from "./errors";

export type CreateDynamicSecretOptions = Omit<DefaultApiApiV1DynamicSecretsPostRequest["apiV1DynamicSecretsPostRequest"], "provider"> & {
	provider: TDynamicSecretProvider;
};
export type DeleteDynamicSecretOptions = DefaultApiApiV1DynamicSecretsNameDeleteRequest["apiV1DynamicSecretsNameDeleteRequest"];
export type CreateDynamicSecretLeaseOptions = DefaultApiApiV1DynamicSecretsLeasesPostRequest["apiV1DynamicSecretsLeasesPostRequest"];
export type DeleteDynamicSecretLeaseOptions =
	DefaultApiApiV1DynamicSecretsLeasesLeaseIdDeleteRequest["apiV1DynamicSecretsLeasesLeaseIdDeleteRequest"];
export type RenewDynamicSecretLeaseOptions =
	DefaultApiApiV1DynamicSecretsLeasesLeaseIdRenewPostRequest["apiV1DynamicSecretsLeasesLeaseIdRenewPostRequest"];

export type CreateDynamicSecretResult = ApiV1DynamicSecretsGet200ResponseDynamicSecretsInner;
export type DeleteDynamicSecretResult = ApiV1DynamicSecretsGet200ResponseDynamicSecretsInner;
export type CreateDynamicSecretLeaseResult = ApiV1DynamicSecretsLeasesPost200Response;
export type DeleteDynamicSecretLeaseResult = ApiV1DynamicSecretsLeasesLeaseIdDelete200Response;
export type RenewDynamicSecretLeaseResult = ApiV1DynamicSecretsLeasesLeaseIdDelete200Response;

export default class DynamicSecretsClient {
	#apiInstance: InfisicalApi;
	#requestOptions: RawAxiosRequestConfig | undefined;
	constructor(apiInstance: InfisicalApi, requestOptions: RawAxiosRequestConfig | undefined) {
		this.#apiInstance = apiInstance;
		this.#requestOptions = requestOptions;
	}

	async create(options: CreateDynamicSecretOptions): Promise<CreateDynamicSecretResult> {
		try {
			const res = await this.#apiInstance.apiV1DynamicSecretsPost(
				{
					apiV1DynamicSecretsPostRequest: options as DefaultApiApiV1DynamicSecretsPostRequest["apiV1DynamicSecretsPostRequest"]
				},
				this.#requestOptions
			);

			return res.data.dynamicSecret;
		} catch (err) {
			throw newInfisicalError(err);
		}
	}

	async delete(dynamicSecretName: string, options: DeleteDynamicSecretOptions): Promise<DeleteDynamicSecretResult> {
		try {
			const res = await this.#apiInstance.apiV1DynamicSecretsNameDelete(
				{
					name: dynamicSecretName,
					apiV1DynamicSecretsNameDeleteRequest: options
				},
				this.#requestOptions
			);

			return res.data.dynamicSecret;
		} catch (err) {
			throw newInfisicalError(err);
		}
	}

	leases = {
		create: async (options: CreateDynamicSecretLeaseOptions): Promise<CreateDynamicSecretLeaseResult> => {
			try {
				const res = await this.#apiInstance.apiV1DynamicSecretsLeasesPost(
					{
						apiV1DynamicSecretsLeasesPostRequest: options
					},
					this.#requestOptions
				);

				return res.data;
			} catch (err) {
				throw newInfisicalError(err);
			}
		},
		delete: async (leaseId: string, options: DeleteDynamicSecretLeaseOptions): Promise<DeleteDynamicSecretLeaseResult> => {
			try {
				const res = await this.#apiInstance.apiV1DynamicSecretsLeasesLeaseIdDelete(
					{
						leaseId: leaseId,
						apiV1DynamicSecretsLeasesLeaseIdDeleteRequest: options
					},
					this.#requestOptions
				);

				return res.data;
			} catch (err) {
				throw newInfisicalError(err);
			}
		},

		renew: async (leaseId: string, options: RenewDynamicSecretLeaseOptions): Promise<RenewDynamicSecretLeaseResult> => {
			try {
				const res = await this.#apiInstance.apiV1DynamicSecretsLeasesLeaseIdRenewPost(
					{
						leaseId: leaseId,
						apiV1DynamicSecretsLeasesLeaseIdRenewPostRequest: options
					},
					this.#requestOptions
				);

				return res.data;
			} catch (err) {
				throw newInfisicalError(err);
			}
		}
	};
}
