import { ApiClient } from "../base";
import { ListKmsKeyRequest, ListKmsKeysResponse } from "../types";

export class KmsApi {
    constructor(private apiClient: ApiClient){}
    
    async ListKeys(params: ListKmsKeyRequest) : Promise<ListKmsKeysResponse>{
        return this.apiClient.get<ListKmsKeysResponse>("/api/v1/kms/keys", {
            params: params,
        });
    }
}