

export interface KmsKey {
    id: string;
    orgId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    encryptionAlgorithm: string;
    description?: string;
    isDisabled?: boolean;
    projectId?: string;
    keyUsage?: string;
    version?: number;
}

export interface ListKmsKeysResponse {
    keys: KmsKey[];
    totalCount: number;
}

export interface ListKmsKeyRequest {
    projectId: string;
    offset?: number;
    limit?: number;
    orderBy?: "name";
    orderDirection?: "asc"|"desc";
    search?: string;
}

export type ListKmsOptions = {
    projectId: string;
    offset?: number;
    limit?: number;
    orderBy?: "name";
    orderDirection?: "asc" | "desc";
    search?: string;
}