import { newInfisicalError } from "./errors";
import {
  CreateKmsKeyOptions,
  DeleteKmsKeyOptions,
  GetKmsKeyByNameOptions,
  KmsDecryptDataOptions,
  KmsEncryptDataOptions,
  KmsGetPublicKeyOptions,
  KmsListSigningAlgorithmsOptions,
  KmsSignDataOptions,
  KmsVerifyDataOptions,
} from "../api/types/kms";
import { KmsApi } from "../api/endpoints/kms";

export default class KmsClient {
  constructor(private apiClient: KmsApi) {}

  keys = () => {
    const create = async (options: CreateKmsKeyOptions) => {
      try {
        const res = await this.apiClient.createKmsKey(options);
        return res.key;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    const deleteKmsKey = async (options: DeleteKmsKeyOptions) => {
      try {
        const res = await this.apiClient.deleteKmsKey(options);
        return res.key;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    const getByName = async (options: GetKmsKeyByNameOptions) => {
      try {
        const res = await this.apiClient.getKmsKeyByName(options);

        return res.key;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    return {
      create,
      delete: deleteKmsKey,
      getByName,
    };
  };

  encryption = () => {
    const encrypt = async (options: KmsEncryptDataOptions) => {
      try {
        const res = await this.apiClient.encryptData(options);
        return res.ciphertext;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    const decrypt = async (options: KmsDecryptDataOptions) => {
      try {
        const res = await this.apiClient.decryptData(options);
        return res.plaintext;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    return {
      encrypt,
      decrypt,
    };
  };

  signing = () => {
    const sign = async (options: KmsSignDataOptions) => {
      try {
        const res = await this.apiClient.signData(options);
        return res;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    const verify = async (options: KmsVerifyDataOptions) => {
      try {
        const res = await this.apiClient.verifyData(options);
        return res;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    const listSigningAlgorithms = async (
      options: KmsListSigningAlgorithmsOptions,
    ) => {
      try {
        const res = await this.apiClient.listSigningAlgorithms(options);
        return res.signingAlgorithms;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    const getPublicKey = async (options: KmsGetPublicKeyOptions) => {
      try {
        const res = await this.apiClient.getSigningPublicKey(options);
        return res.publicKey;
      } catch (err) {
        throw await newInfisicalError(err);
      }
    };

    return {
      sign,
      verify,
      listSigningAlgorithms,
      getPublicKey,
    };
  };
}
