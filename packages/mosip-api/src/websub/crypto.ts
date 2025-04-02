import { importPKCS8, jwtDecrypt } from "jose";
import { asn1, pkcs12, pki, md } from "node-forge";
import { join } from "node:path";
import { env } from "../constants";
import fs from "node:fs";
import { z } from "zod";
import crypto from "node:crypto";

/**
 * Reads and extracts private key and certificate from a PKCS#12 file.
 * @param filePath - The path to the PKCS#12 (.p12) file.
 * @param password - The password for decrypting the PKCS#12 file.
 * @returns An object containing the private key and certificate in PEM format.
 */
export const extractKeysFromPkcs12 = (
  fileContents: string,
  password: string,
) => {
  const p12Asn1 = asn1.fromDer(fileContents);
  const p12Object = pkcs12.pkcs12FromAsn1(p12Asn1, password);

  let privateKeyPkcs8: pki.PEM | null = null;
  let certificate: pki.PEM | null = null;

  // Extract private key and certificate
  p12Object.safeContents.forEach((safeContent) => {
    safeContent.safeBags.forEach((safeBag) => {
      if (safeBag.type === pki.oids.pkcs8ShroudedKeyBag && safeBag.key) {
        // To return PKCS#1:
        // privateKeyPkcs1 = pki.privateKeyToPem(safeBag.key);
        const privateKeyAsn1 = pki.privateKeyToAsn1(safeBag.key);
        const privateKeyPkcs8Asn1 = pki.wrapRsaPrivateKey(privateKeyAsn1);
        privateKeyPkcs8 = pki.privateKeyInfoToPem(privateKeyPkcs8Asn1);
      } else if (safeBag.type === pki.oids.certBag && safeBag.cert) {
        certificate = pki.certificateToPem(safeBag.cert);
      }
    });
  });

  if (privateKeyPkcs8 === null)
    throw new Error("PEM private key not available in keystore");

  if (certificate === null)
    throw new Error("PEM certificate not available in keystore");

  return { privateKeyPkcs8, certificate } as {
    privateKeyPkcs8: pki.PEM;
    certificate: pki.PEM;
  };
};

const p12fileContents = fs.readFileSync(env.DECRYPT_P12_FILE_PATH, "binary");
const { privateKeyPkcs8 } = extractKeysFromPkcs12(
  p12fileContents,
  env.DECRYPT_P12_FILE_PASSWORD,
);

export const Credential = z.object({
  id: z.string(),
  issuedTo: z.string(),
  issuanceDate: z.string().datetime(),
  credentialSubject: z.object({
    birthCertificateNumber: z.string(),
    VID: z.string(),
    id: z.string(),
  }),
  type: z.array(z.literal("MOSIPVerifiableCredential")),
});

/**
 * Decrypts a MOSIP credential using RSA-OAEP and AES-256-GCM.
 * @param encryptedBase64Credential - The Base64-encoded credential from the payload.
 * @param privateKeyPem - The extracted private key in PEM format.
 * @returns The decrypted credential
 */
export function decryptMosipCredential(
  encryptedBase64Credential: string,
  privateKeyPem = privateKeyPkcs8,
) {
  const encryptedPayload = Buffer.from(encryptedBase64Credential, "base64");
  const splitter = Buffer.from("#KEY_SPLITTER#");
  const splitterIndex = encryptedPayload.indexOf(splitter);

  if (splitterIndex === -1) throw new Error("Splitter not found in payload");

  const encryptedKeyPart = encryptedPayload.subarray(0, splitterIndex);
  const encryptedContentPart = encryptedPayload.subarray(
    splitterIndex + splitter.length,
  );

  // Parse encrypted session key: skip version (6 bytes) and thumbprint (32 bytes)
  const sessionKeyData = encryptedKeyPart.subarray(6 + 32);

  // Decrypt session key using RSA-OAEP + SHA-256
  const forgePrivateKey = pki.privateKeyFromPem(privateKeyPem);

  const decryptedSessionKeyBinary = forgePrivateKey.decrypt(
    sessionKeyData.toString("binary"),
    "RSA-OAEP",
    { md: md.sha256.create() },
  );
  const sessionKey = Buffer.from(decryptedSessionKeyBinary, "binary");

  // Extract AES-GCM components
  const aad = encryptedContentPart.subarray(0, 32);
  const iv = aad.subarray(0, 12);
  const tag = encryptedContentPart.subarray(encryptedContentPart.length - 16);
  const ciphertext = encryptedContentPart.subarray(
    32,
    encryptedContentPart.length - 16,
  );

  // Decrypt AES-256-GCM
  const decipher = crypto.createDecipheriv("aes-256-gcm", sessionKey, iv);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  const decryptedJson = JSON.parse(decrypted.toString("utf-8"));
  return Credential.parse(decryptedJson);
}
