

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

export interface KmsKeyResponse {
    key: KmsKey;
}

export interface GetKmsKeyByNameOptions {
    keyName: string;
    projectId: string;
}

export interface ListKmsKeysResponse {
    keys: KmsKey[];
    totalCount: number;
}

export enum KmsKeyUsage {
    EncryptDecrypt = "encrypt-decrypt",
    SignVerify = "sign-verify"
}

export enum KmsKeyEncryptionAlgorithm {
    AES256 = "aes-256-gcm",
    AES128 = "aes-128-gcm",
    RSA_4096 = "RSA_4096",
    ECC_NIST_P256 = "ECC_NIST_P256",
}
export interface CreateKmsKeyRequest {
    projectId: string;
    name: string;
    description?: string;
    keyUsage?: KmsKeyUsage;
    encryptionAlgorithm?: KmsKeyEncryptionAlgorithm;
}

export type CreateKmsOptions = {
    projectId: string;
    name: string;
    description?: string;
    keyUsage?: KmsKeyUsage;
    encryptionAlgorithm?: KmsKeyEncryptionAlgorithm;
}
export interface UpdateKmsKeyRequest {
    keyId: string;
    name?: string;
    isDisabled?: boolean;
    description?: string;
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

export interface EncryptKmsKeyOptions {
    keyId: string;
    plaintext: string;
}

export interface DecryptKmsKeyOptions {
    keyId: string;
    ciphertext: string;
}
export interface EncryptKmsKeyResponse {
    ciphertext: string;
}
export interface DecryptKmsKeyResponse {
    plaintext: string;  
}

export enum KmsSigningAlgorithm{
    RSASSA_PSS_SHA_512 = "RSASSA_PSS_SHA_512",
    RSASSA_PSS_SHA_384 = "RSASSA_PSS_SHA_384",
    RSASSA_PSS_SHA_256 = "RSASSA_PSS_SHA_256",
    RSASSA_PKCS1_V1_5_SHA_512 = "RSASSA_PKCS1_V1_5_SHA_512",
    RSASSA_PKCS1_V1_5_SHA_384 = "RSASSA_PKCS1_V1_5_SHA_384",
    RSASSA_PKCS1_V1_5_SHA_256 = "RSASSA_PKCS1_V1_5_SHA_256",
    ECDSA_SHA_512 = "ECDSA_SHA_512",
    ECDSA_SHA_384 = "ECDSA_SHA_384",
    ECDSA_SHA_256 = "ECDSA_SHA_256",
}

export interface KmsSignDataOptions {
    keyId: string;
    signingAlgorithm: KmsSigningAlgorithm;
    data: string;
    isDigest?:boolean;
}

export interface KmsSignDataResponse {
    signature: string;
    keyId: string;
    signingAlgorithm: KmsSigningAlgorithm;
}

export interface KmsVerifySignatureOptions {
    keyId: string;
    data: string;
    signature: string;
    signingAlgorithm: KmsSigningAlgorithm;
    isDigest?: boolean;
}

export interface KmsVerifySignatureResponse {
    signatureValid: boolean;
    keyId: string;
    signingAlgorithm: KmsSigningAlgorithm;
}

export interface KmsPublicKeyReponse {
    publicKey: string;
}

export interface KmsSigningAlgorithmsResponse {
    signingAlgorithms: KmsSigningAlgorithm[];
}