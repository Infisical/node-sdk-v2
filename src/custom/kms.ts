import { KmsApi } from "../api/endpoints/kms";
import { CreateKmsOptions, DecryptKmsKeyOptions, EncryptKmsKeyOptions, GetKmsKeyByNameOptions, KmsKeyEncryptionAlgorithm, KmsKeyUsage, ListKmsOptions } from "../api/types";
import { newInfisicalError } from "./errors";

export default class KmsClient {
    constructor(private apiClient: KmsApi) {}

    listKeys = async (options: ListKmsOptions) => {
        try {
            const res = await this.apiClient.ListKeys({
                projectId: options.projectId,
                offset: options.offset ? options.offset : 0,
                limit: options.limit ? options.limit : 100,
                orderBy: options.orderBy,
                orderDirection: options.orderDirection,
                search: options.search,
            })
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }

    getKeyById = async (keyId: string) => {
        try {
            const res = await this.apiClient.GetKeyById(keyId);
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }

    getKeyByName = async (options: GetKmsKeyByNameOptions) => {
        try {
            const res = await this.apiClient.GetKeyByName(options);
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }

    createKey = async (data: CreateKmsOptions) =>{
        try {
            const res = await this.apiClient.CreateKey({
                projectId: data.projectId,
                name: data.name,
                description: data.description,
                keyUsage: data.keyUsage ? data.keyUsage : KmsKeyUsage.EncryptDecrypt,
                encryptionAlgorithm: data.encryptionAlgorithm ? data.encryptionAlgorithm : KmsKeyEncryptionAlgorithm.AES256,
            });
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }

    updateKey = async (options: { keyId: string; name?: string; isDisabled?: boolean; description?: string }) => {
        try {
            const res = await this.apiClient.updateKey({
                keyId: options.keyId,
                name: options.name,
                isDisabled: options.isDisabled,
                description: options.description,
            });
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }

    deleteKey = async (keyId: string) => {
        try {
            const res = await this.apiClient.deleteKey(keyId);
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }

    encryptData = async (options: EncryptKmsKeyOptions) => {
        try {
            const res = await this.apiClient.encryptData({
                keyId: options.keyId,
                plaintext: Buffer.from(options.plaintext).toString('base64'), 
            });
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }

    decryptData = async (options: DecryptKmsKeyOptions) => {
        try {
            const res = await this.apiClient.decryptData({
                keyId: options.keyId,
                ciphertext: options.ciphertext,
            });
            res.plaintext = Buffer.from(res.plaintext, 'base64').toString('utf-8'); 
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }
}