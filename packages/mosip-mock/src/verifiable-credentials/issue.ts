import { CompactSign, importPKCS8 } from "jose";
import { randomUUID, createPrivateKey } from "node:crypto";
import { canonicalize } from "json-canonicalize";
import { env, PRIVATE_KEY } from "../constants";

const ISSUER = `${env.ISSUER_URL}/.well-known/controller.json`;
export const VERIFICATION_METHOD = `${env.ISSUER_URL}/.well-known/public-key.json#keys-1`;

export async function createMockVC({
  birthCertificateNumber,
  vid,
  id,
}: {
  birthCertificateNumber: string;
  vid: string;
  id: string;
}) {
  const privateKey = createPrivateKey(PRIVATE_KEY);
  const issuanceDate = new Date().toISOString();

  const credentialSubject = {
    birthCertificateNumber,
    VID: vid,
    id: `http://credential.idrepo/credentials/${id}`,
    vcVer: "VC-V1",
  };

  const unsignedVC = {
    issuanceDate,
    credentialSubject,
    id: `http://credential.idrepo/credentials/${randomUUID()}`,
    type: ["VerifiableCredential", "MOSIPVerifiableCredential"],
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      `${env.ISSUER_URL}/.well-known/mosip-context.json`,
      { sec: "https://w3id.org/security#" },
    ],
    issuer: ISSUER,
  };

  const canonicalPayload = canonicalize(unsignedVC);
  const payloadBytes = new TextEncoder().encode(canonicalPayload);

  const jwsHeader = {
    alg: "PS256",
    kid: VERIFICATION_METHOD,
    b64: false,
    crit: ["b64"],
  };

  const jwsFull = await new CompactSign(payloadBytes)
    .setProtectedHeader(jwsHeader)
    .sign(privateKey);

  const [protectedHeader, , signature] = jwsFull.split(".");
  const detachedJws = `${protectedHeader}..${signature}`;

  return {
    ...unsignedVC,
    proof: {
      type: "RsaSignature2018",
      created: issuanceDate,
      proofPurpose: "assertionMethod",
      verificationMethod: VERIFICATION_METHOD,
      jws: detachedJws,
    },
  };
}
