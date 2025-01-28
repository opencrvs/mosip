import * as forge from "node-forge";
import {
  KEY_SPLITTER,
  VERSION_RSA_2048,
  THUMBPRINT_LENGTH,
  NONCE_SIZE,
  AAD_SIZE,
  GCM_TAG_LENGTH,
  ASYMMETRIC_ALGORITHM,
  SYMMETRIC_ALGORITHM,
  IS_THUMBPRINT,
  OPENCRVS_PRIVATE_KEY,
} from "./crypto-constants";
import { env } from "../constants";

export async function decryptData(data: string): Promise<{
  eventId: string;
  uinToken: string;
  trackingId: string;
}> {
  if (env.DANGEROUSLY_BYPASS_ENCRYPTION) {
    return JSON.parse(data);
  }

  const requestData = Buffer.from(data, "base64url");
  const keyDemiliterIndex: number = requestData.indexOf(KEY_SPLITTER);
  if (keyDemiliterIndex < 0) {
    throw new Error("Improper encrypted data format");
  }

  let encryptedSymmetricKey: Buffer;
  let nonce: Buffer;
  let aad: Buffer = Buffer.alloc(0);
  let encryptedData: Buffer;
  let authTag: Buffer;

  if (requestData.indexOf(VERSION_RSA_2048) === 0) {
    encryptedSymmetricKey = requestData.subarray(
      IS_THUMBPRINT
        ? VERSION_RSA_2048.length + THUMBPRINT_LENGTH
        : VERSION_RSA_2048.length,
      keyDemiliterIndex,
    );
    nonce = requestData.subarray(
      keyDemiliterIndex + KEY_SPLITTER.length,
      keyDemiliterIndex + KEY_SPLITTER.length + NONCE_SIZE,
    );
    aad = requestData.subarray(
      keyDemiliterIndex + KEY_SPLITTER.length,
      keyDemiliterIndex + KEY_SPLITTER.length + AAD_SIZE,
    );
    encryptedData = requestData.subarray(
      keyDemiliterIndex + KEY_SPLITTER.length + AAD_SIZE,
      requestData.length - GCM_TAG_LENGTH,
    );
    authTag = requestData.subarray(
      requestData.length - GCM_TAG_LENGTH,
      requestData.length,
    );
  } else if (IS_THUMBPRINT) {
    encryptedSymmetricKey = requestData.subarray(
      THUMBPRINT_LENGTH,
      keyDemiliterIndex,
    );
    encryptedData = requestData.subarray(
      keyDemiliterIndex + KEY_SPLITTER.length + AAD_SIZE,
      requestData.length - GCM_TAG_LENGTH,
    );
    authTag = requestData.subarray(
      requestData.length - GCM_TAG_LENGTH,
      requestData.length,
    );
    nonce = encryptedData.subarray(
      encryptedData.length - GCM_TAG_LENGTH,
      encryptedData.length,
    );
  } else {
    encryptedSymmetricKey = requestData.subarray(0, keyDemiliterIndex);
    encryptedData = requestData.subarray(
      keyDemiliterIndex + KEY_SPLITTER.length,
      requestData.length - GCM_TAG_LENGTH,
    );
    authTag = requestData.subarray(
      requestData.length - GCM_TAG_LENGTH,
      requestData.length,
    );
    nonce = encryptedData.subarray(
      encryptedData.length - GCM_TAG_LENGTH,
      encryptedData.length,
    );
  }
  const opencrvsPrivKey: forge.pki.rsa.PrivateKey =
    forge.pki.privateKeyFromPem(OPENCRVS_PRIVATE_KEY);
  const decryptedSymmetricKey = opencrvsPrivKey.decrypt(
    encryptedSymmetricKey.toString("binary"),
    ASYMMETRIC_ALGORITHM,
    {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    },
  );
  const decipher = forge.cipher.createDecipher(
    SYMMETRIC_ALGORITHM,
    decryptedSymmetricKey,
  );
  decipher.start({
    iv: nonce.toString("binary"),
    additionalData: aad.toString("binary"),
    tagLength: GCM_TAG_LENGTH * 8,
    tag: forge.util.createBuffer(authTag),
  });
  decipher.update(forge.util.createBuffer(encryptedData));
  const pass: boolean = decipher.finish();
  if (!pass) {
    throw new Error("Unable to decrypt data");
  }

  return JSON.parse(
    Buffer.from(decipher.output.getBytes(), "binary").toString("utf8"),
  );
}
