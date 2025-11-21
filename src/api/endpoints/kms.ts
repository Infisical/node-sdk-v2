import { ApiClient } from "../base";
import {
  CreateKmsKeyOptions,
  CreateKmsKeyResponse,
  DeleteKmsKeyOptions,
  DeleteKmsKeyResponse,
  GetKmsKeyByNameOptions,
  GetKmsKeyByNameResponse,
  KmsDecryptDataOptions,
  KmsDecryptDataResponse,
  KmsEncryptDataOptions,
  KmsEncryptDataResponse,
  KmsGetPublicKeyOptions,
  KmsGetPublicKeyResponse,
  KmsListSigningAlgorithmsOptions,
  KmsListSigningAlgorithmsResponse,
  KmsSignDataOptions,
  KmsSignDataResponse,
  KmsVerifyDataOptions,
  KmsVerifyDataResponse,
} from "../types/kms";

export class KmsApi {
  constructor(private apiClient: ApiClient) {}

  async createKmsKey(data: CreateKmsKeyOptions): Promise<CreateKmsKeyResponse> {
    return this.apiClient.post<CreateKmsKeyResponse>("api/v1/kms/keys", data);
  }

  async deleteKmsKey(data: DeleteKmsKeyOptions): Promise<DeleteKmsKeyResponse> {
    return this.apiClient.delete<DeleteKmsKeyResponse>(
      `api/v1/kms/keys/${data.keyId}`,
    );
  }

  async getKmsKeyByName(
    data: GetKmsKeyByNameOptions,
  ): Promise<GetKmsKeyByNameResponse> {
    return this.apiClient.get<GetKmsKeyByNameResponse>(
      `api/v1/kms/keys/key-name/${encodeURIComponent(data.name)}?projectId=${data.projectId}`,
    );
  }

  async encryptData(
    data: KmsEncryptDataOptions,
  ): Promise<KmsEncryptDataResponse> {
    return this.apiClient.post<KmsEncryptDataResponse>(
      `api/v1/kms/keys/${data.keyId}/encrypt`,
      data,
    );
  }

  async decryptData(
    data: KmsDecryptDataOptions,
  ): Promise<KmsDecryptDataResponse> {
    return this.apiClient.post<KmsDecryptDataResponse>(
      `api/v1/kms/keys/${data.keyId}/decrypt`,
      data,
    );
  }

  async signData(data: KmsSignDataOptions): Promise<KmsSignDataResponse> {
    return this.apiClient.post<KmsSignDataResponse>(
      `api/v1/kms/keys/${data.keyId}/sign`,
      data,
    );
  }

  async verifyData(data: KmsVerifyDataOptions): Promise<KmsVerifyDataResponse> {
    return this.apiClient.post<KmsVerifyDataResponse>(
      `api/v1/kms/keys/${data.keyId}/verify`,
      data,
    );
  }

  async listSigningAlgorithms(
    data: KmsListSigningAlgorithmsOptions,
  ): Promise<KmsListSigningAlgorithmsResponse> {
    return this.apiClient.get<KmsListSigningAlgorithmsResponse>(
      `api/v1/kms/keys/${data.keyId}/signing-algorithms`,
    );
  }

  async getSigningPublicKey(
    data: KmsGetPublicKeyOptions,
  ): Promise<KmsGetPublicKeyResponse> {
    return this.apiClient.get<KmsGetPublicKeyResponse>(
      `api/v1/kms/keys/${data.keyId}/public-key`,
    );
  }
}
