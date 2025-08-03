import { ApiClient } from "../base";
import { CreateKmsKeyRequest, GetKmsKeyByNameOptions, KmsKeyResponse, ListKmsKeyRequest, ListKmsKeysResponse, UpdateKmsKeyRequest } from "../types";

export class KmsApi {
    constructor(private apiClient: ApiClient){}
    
    async ListKeys(params: ListKmsKeyRequest) : Promise<ListKmsKeysResponse>{
        return this.apiClient.get<ListKmsKeysResponse>("/api/v1/kms/keys", {
            params: params,
        });
    }

    async GetKeyById(keyId: string) : Promise<KmsKeyResponse> {
        return this.apiClient.get<KmsKeyResponse>(`/api/v1/kms/keys/${keyId}`);
    }

    async GetKeyByName(options: GetKmsKeyByNameOptions): Promise<KmsKeyResponse> {
        return this.apiClient.get<KmsKeyResponse>(`/api/v1/kms/keys/key-name/${options.keyName}`, {
            params: { projectId: options.projectId },
        });
    }

    async CreateKey(data: CreateKmsKeyRequest): Promise<KmsKeyResponse> {
        return this.apiClient.post<KmsKeyResponse>(`/api/v1/kms/keys`, data);
    }

    async updateKey(options: UpdateKmsKeyRequest): Promise<KmsKeyResponse> {
        const { keyId, ...updateData } = options;
        return this.apiClient.patch<KmsKeyResponse>(`/api/v1/kms/keys/${keyId}`, updateData);
    }

    async deleteKey(keyId: string): Promise<KmsKeyResponse> {
        return this.apiClient.delete<KmsKeyResponse>(`/api/v1/kms/keys/${keyId}`);
    }
}