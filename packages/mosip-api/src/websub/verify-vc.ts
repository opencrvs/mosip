import { compactVerify, flattenedVerify, importSPKI } from "jose";
import { z } from "zod";
import { MOSIP_VERIFIABLE_CREDENTIAL_ALLOWED_URLS } from "../constants";
import canonicalize from "canonicalize";

export const MOSIPVerifiableCredential = z.object({
  issuanceDate: z.string().datetime(),
  credentialSubject: z.object({
    birthCertificateNumber: z.string(),
    VID: z.string(),
    id: z.string().url(),
    vcVer: z.literal("VC-V1"),
  }),
  id: z.string().url(),
  proof: z.object({
    type: z.string(),
    created: z.string().datetime(),
    proofPurpose: z.string(),
    verificationMethod: z.string().url(),
    jws: z.string(),
  }),
  type: z.tuple([
    z.literal("VerifiableCredential"),
    z.literal("MOSIPVerifiableCredential"),
  ]),
  "@context": z.tuple([
    z.literal("https://www.w3.org/2018/credentials/v1"),
    z.string().endsWith("/.well-known/mosip-context.json"),
    z.object({ sec: z.literal("https://w3id.org/security#") }),
  ]),
  issuer: z.string().url(),
});

export const verifyCredentialOrThrow = async (
  credential: z.infer<typeof MOSIPVerifiableCredential>,
) => {
  const { jws, verificationMethod } = credential.proof;
  const { proof, ...payload } = credential;

  if (!MOSIP_VERIFIABLE_CREDENTIAL_ALLOWED_URLS.includes(verificationMethod)) {
    throw new Error("❌ Verification method not allowed");
  }

  const res = await fetch(verificationMethod);
  const { publicKeyPem } = await res.json();
  const key = await importSPKI(publicKeyPem, "PS256");

  const [encodedHeader, , encodedSignature] = jws.split(".");

  const canonicalPayload = canonicalize(payload);
  const payloadBytes = new TextEncoder().encode(canonicalPayload);

  await flattenedVerify(
    {
      protected: encodedHeader,
      payload: payloadBytes,
      signature: encodedSignature,
    },
    key,
  );
};
