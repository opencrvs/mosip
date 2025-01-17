import * as crypto from "node:crypto";
import {
  ENCRYPT_PEM_CERT,
  SIGN_P12_FILE_CERTIFICATE_PEM_FILE,
  SIGN_P12_FILE_PRIVATE_KEY_PEM_FILE,
} from "../constants";
import * as jose from "jose";
import { urlsafeBase64Encode } from "./utils";

export const getPemCertificateThumbprint = () => {
  const fingerprint = new crypto.X509Certificate(ENCRYPT_PEM_CERT)
    .fingerprint256; // In "node:crypto", this gives the SHA-256 fingerprint as a hexadecimal string
  return Buffer.from(fingerprint.replace(/:/g, ""), "hex");
};

const SYMMETRIC_NONCE_SIZE = 12;
const SYMMETRIC_KEY_LENGTH = 256;

/** Symmetrically (allows to be decrypted by the same key) encrypts the data */
const symmetricEncrypt = (data: Buffer, key: Buffer) => {
  const nonce = crypto.randomBytes(SYMMETRIC_NONCE_SIZE / 8);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([nonce, encrypted, tag]);
};

/**
 * Asymmetrically (allowed to be decrypted by the partner certificate) encrypts the data
 *
 * NOTE: (compared to the Python implementation...)
 * crypto.publicEncrypt does not support a label parameter for OAEP, which Python's asymmetric.padding.OAEP supports. If label is used in Python and required, Node.js might not support it directly. However, for most cases where label=None, the above solution works.
 */
const asymmetricEncrypt = (aesRandomKey: Buffer) => {
  const { publicKey } = new crypto.X509Certificate(ENCRYPT_PEM_CERT);
  const encryptedKey = crypto.publicEncrypt(
    {
      key: publicKey.export({ type: "spki", format: "pem" }),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesRandomKey
  );

  return encryptedKey;
};

export const encryptAuthData = (data: string) => {
  const aesKey = crypto.randomBytes(SYMMETRIC_KEY_LENGTH / 8);
  const encryptedData = symmetricEncrypt(Buffer.from(data), aesKey);
  const encryptedAuthB64Data = encryptedData.toString("base64"); // this was urlencoded in Python
  const encryptedAesKey = asymmetricEncrypt(aesKey);
  const encryptedAesKeyB64 = encryptedAesKey.toString("base64"); // this was urlencoded in Python

  const sha256Hash = crypto.createHash("sha256");
  sha256Hash.update(data);
  const authDataHash = sha256Hash.digest("hex").toUpperCase();
  const authDataHashBuffer = Buffer.from(authDataHash, "utf-8");
  const encryptedAuthDataHash = symmetricEncrypt(authDataHashBuffer, aesKey);
  const encryptedAuthDataHashBase64 = encryptedAuthDataHash.toString("base64");

  return {
    encryptedAuthB64Data,
    encryptedAesKeyB64,
    encryptedAuthDataHashBase64,
  };
};

export async function signAuthRequestData(
  authRequestData: string,
  algorithm = "RS256"
) {
  const protectedHeader = {
    alg: algorithm,
    x5c: [urlsafeBase64Encode(Buffer.from(SIGN_P12_FILE_CERTIFICATE_PEM_FILE))],
  };

  const unprotectedHeader = {
    kid: crypto
      .createHash("sha256")
      .update(ENCRYPT_PEM_CERT)
      .digest("base64url"), // this was urlencoded in Python
  };

  const privateKey = await jose.importPKCS8(
    SIGN_P12_FILE_PRIVATE_KEY_PEM_FILE,
    algorithm
  );

  const flattenedSign = await new jose.FlattenedSign(
    Buffer.from(authRequestData, "utf-8")
  )
    .setProtectedHeader(protectedHeader)
    .setUnprotectedHeader(unprotectedHeader)
    .sign(privateKey);

  const parts = [
    flattenedSign.protected,
    "", // No payload in this case
    flattenedSign.signature,
  ];
  return `${parts[0]}..${parts[2]}`;
}
