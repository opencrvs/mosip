import { FlattenedSign } from "jose";
import { randomUUID, createPrivateKey } from "node:crypto";
import canonicalize from "canonicalize";
import { env, PRIVATE_KEY } from "../constants";

const ISSUER = `${env.ISSUER_URL}/.well-known/controller.json`;
export const PUBLIC_KEY_URL = `${env.ISSUER_URL}/.well-known/public-key.json`;

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

  const protectedHeader = {
    alg: "PS256",
    b64: false,
    crit: ["b64"],
    kid: PUBLIC_KEY_URL,
  };

  const { protected: encodedHeader, signature } = await new FlattenedSign(
    payloadBytes,
  )
    .setProtectedHeader(protectedHeader)
    .sign(privateKey);

  const detachedJws = `${encodedHeader}..${signature}`;

  return {
    ...unsignedVC,
    proof: {
      type: "RsaSignature2018",
      created: issuanceDate,
      proofPurpose: "assertionMethod",
      verificationMethod: PUBLIC_KEY_URL,
      jws: detachedJws,
    },
  };
}
