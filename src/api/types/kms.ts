export enum EncryptionAlgorithm {
  RSA_4096 = "RSA_4096",
  ECC_NIST_P256 = "ECC_NIST_P256",
  AES_256_GCM = "aes-256-gcm",
  AES_128_GCM = "aes-128-gcm",
}

export enum SigningAlgorithm {
  // RSA PSS algorithms
  // These are NOT deterministic and include randomness.
  // This means that the output signature is different each time for the same input.
  RSASSA_PSS_SHA_512 = "RSASSA_PSS_SHA_512",
  RSASSA_PSS_SHA_384 = "RSASSA_PSS_SHA_384",
  RSASSA_PSS_SHA_256 = "RSASSA_PSS_SHA_256",

  // RSA PKCS#1 v1.5 algorithms
  // These are deterministic and the output is the same each time for the same input.
  RSASSA_PKCS1_V1_5_SHA_512 = "RSASSA_PKCS1_V1_5_SHA_512",
  RSASSA_PKCS1_V1_5_SHA_384 = "RSASSA_PKCS1_V1_5_SHA_384",
  RSASSA_PKCS1_V1_5_SHA_256 = "RSASSA_PKCS1_V1_5_SHA_256",

  // ECDSA algorithms
  // None of these are deterministic and include randomness like RSA PSS.
  ECDSA_SHA_512 = "ECDSA_SHA_512",
  ECDSA_SHA_384 = "ECDSA_SHA_384",
  ECDSA_SHA_256 = "ECDSA_SHA_256",
}

export enum KeyUsage {
  ENCRYPTION = "encrypt-decrypt",
  SIGNING = "sign-verify",
}

export interface KmsKey {
  id: string;
  description: string;
  isDisabled: boolean;
  orgId: string;
  name: string;
  projectId: string;
  keyUsage: KeyUsage;
  version: number;
  encryptionAlgorithm: EncryptionAlgorithm;
}

export interface CreateKmsKeyOptions {
  projectId: string;
  name: string;
  description?: string;

  keyUsage: KeyUsage;
  encryptionAlgorithm: EncryptionAlgorithm;
}

export interface CreateKmsKeyResponse {
  key: KmsKey;
}

export interface DeleteKmsKeyOptions {
  keyId: string;
}

export interface DeleteKmsKeyResponse {
  key: KmsKey;
}

export interface GetKmsKeyByNameOptions {
  projectId: string;
  name: string;
}

export interface GetKmsKeyByNameResponse {
  key: KmsKey;
}

export interface KmsEncryptDataOptions {
  keyId: string;
  plaintext: string;
}

export interface KmsEncryptDataResponse {
  ciphertext: string;
}

export interface KmsDecryptDataOptions {
  keyId: string;
  ciphertext: string;
}

export interface KmsDecryptDataResponse {
  plaintext: string;
}

export interface KmsSignDataOptions {
  keyId: string;
  data: string;
  signingAlgorithm: SigningAlgorithm;
  isDigest?: boolean;
}

export interface KmsSignDataResponse {
  signature: string;
  keyId: string;
  signingAlgorithm: SigningAlgorithm;
}

export interface KmsVerifyDataOptions {
  keyId: string;
  data: string; // must be base64 encoded
  signature: string;
  signingAlgorithm: SigningAlgorithm;
  isDigest?: boolean;
}

export interface KmsVerifyDataResponse {
  signatureValid: boolean;
  keyId: string;
  signingAlgorithm: SigningAlgorithm;
}

export interface KmsListSigningAlgorithmsOptions {
  keyId: string;
}

export interface KmsListSigningAlgorithmsResponse {
  signingAlgorithms: SigningAlgorithm[];
}

export interface KmsGetPublicKeyOptions {
  keyId: string;
}

export interface KmsGetPublicKeyResponse {
  publicKey: string;
}
