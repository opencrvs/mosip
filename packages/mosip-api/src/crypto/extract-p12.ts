import { readFileSync } from "node:fs";
import { asn1, pkcs12, pki } from "node-forge";

/**
 * Reads and extracts private key and certificate from a PKCS#12 file.
 * @param filePath - The path to the PKCS#12 (.p12) file.
 * @param password - The password for decrypting the PKCS#12 file.
 * @returns An object containing the private key and certificate in PEM format.
 */
export const extractKeysFromPkcs12 = (filePath: string, password: string) => {
  const p12File = readFileSync(filePath, "binary");
  const p12Asn1 = asn1.fromDer(p12File);
  const p12Object = pkcs12.pkcs12FromAsn1(p12Asn1, password);

  let privateKey: pki.PEM | null = null;
  let certificate: pki.PEM | null = null;

  // Extract private key and certificate
  p12Object.safeContents.forEach((safeContent) => {
    safeContent.safeBags.forEach((safeBag) => {
      if (safeBag.type === pki.oids.pkcs8ShroudedKeyBag && safeBag.key) {
        privateKey = pki.privateKeyToPem(safeBag.key);
      } else if (safeBag.type === pki.oids.certBag && safeBag.cert) {
        certificate = pki.certificateToPem(safeBag.cert);
      }
    });
  });

  if (privateKey === null)
    throw new Error("PEM private key not available in keystore");

  if (certificate === null)
    throw new Error("PEM certificate not available in keystore");

  return { privateKey, certificate } as {
    privateKey: pki.PEM;
    certificate: pki.PEM;
  };
};
