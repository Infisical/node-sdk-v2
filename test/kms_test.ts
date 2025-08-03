import { InfisicalSDK, KmsKeyEncryptionAlgorithm, KmsKeyUsage, KmsSigningAlgorithm } from "../src";

(async () =>{
    const client = new InfisicalSDK();

    await client.auth().universalAuth.login({
        clientId: "<CLIENT_ID>",
        clientSecret: "<CLIENT_SECRET>",
    });
    console.log("Logged in successfully");
    
    const keys = await client.kms().listKeys({
        projectId: "<PROJECT_ID>",
        offset: 0,
        limit: 100, // DEFAULT VALUE
        orderBy: "name", // OPTIONAL
        orderDirection: 'desc', // OPTIONAL ALSO HAS "asc"
        search: "<SEARCH_TERM>" 
    });
    console.log("kms keys:", keys);

    const key = await client.kms().getKeyById("<KEY_ID>");
    console.log("Key details:", key);

    const keyByName = await client.kms().getKeyByName({
        keyName: "<KEY_NAME>",
        projectId: "<PROJECT_ID>"
    });
    console.log("Key by name:", keyByName);

    const newKey = await client.kms().createKey({
        projectId: "<PROJECT_ID>",
        name: "<KEY_NAME>",
        description: "<KEY_DESCRIPTION>",
        keyUsage: KmsKeyUsage.SignVerify, // or KmsKeyUsage.EncryptDecrypt
        encryptionAlgorithm: KmsKeyEncryptionAlgorithm.RSA_4096 // or KmsKeyEncryptionAlgorithm.AES256, etc.
    });
    
    console.log("Newly created key:", newKey);

    const updatedKey = await client.kms().updateKey({
        keyId: newKey.key.id,
        name: "<UPDATED_KEY_NAME>",
        isDisabled: false,
        description: "<UPDATED_KEY_DESCRIPTION>"
    });
    console.log("Updated key:", updatedKey);

    const deletedKey = await client.kms().deleteKey(newKey.key.id);
    console.log("Deleted key response:", deletedKey);
    
    const encryptedData = await client.kms().encryptData({
        keyId: newKey.key.id,
        plaintext: "<PLAINTEXT>"
    });
    console.log("Encrypted data:", encryptedData);

    const decryptedData = await client.kms().decryptData({
        keyId: newKey.key.id,
        ciphertext: encryptedData.ciphertext
    });
    console.log("Decrypted data:", decryptedData);
    
    const signedData = await client.kms().signData({
        keyId: newKey.key.id,
        data: "<DATA_TO_SIGN>",
        signingAlgorithm: KmsSigningAlgorithm.RSASSA_PSS_SHA_512 // Specify the signing algorithm
    });
    console.log("Signed data:", signedData);
    const verifiedSignature = await client.kms().verifySignature({
        keyId: newKey.key.id,
        data: "<DATA_TO_SIGN>",
        signature: signedData.signature,
        signingAlgorithm: KmsSigningAlgorithm.RSASSA_PSS_SHA_512 // Specify the same algorithm used for signing
    });
    console.log("Signature verification result:", verifiedSignature);

    const publicKey = await client.kms().getPublicKey(newKey.key.id);
    console.log("Public key:", publicKey);
    const signingAlgorithms = await client.kms().listSigningAlgorithms(newKey.key.id);
    console.log("Signing algorithms:", signingAlgorithms);
})();