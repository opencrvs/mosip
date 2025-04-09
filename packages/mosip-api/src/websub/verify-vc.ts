import { importJWK, compactVerify } from "jose";
import { z } from "zod";
import { env, MOSIP_VERIFIABLE_CREDENTIAL_ALLOWED_URLS } from "../constants";

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
    throw new Error(
      "❌ The verification method is not allowed. Check the configured allowed URLs or the URL in the verifiable credential.",
    );
  }

  // Step 1: Fetch the public JWK
  const res = await fetch(verificationMethod);
  const jwk = await res.json(); // assumes the JWK is directly in the response
  const key = await importJWK(jwk, "PS256"); // algorithm from 'alg' in JWS header

  // Step 2: Reconstruct JWS input
  // jws is in detached mode: header..signature
  const [encodedHeader, , encodedSignature] = jws.split(".");

  // Step 3: Canonicalize and encode payload
  const canonicalPayload = JSON.stringify(payload); // ideally canonicalize via JSON-LD
  const encodedPayload = Buffer.from(canonicalPayload).toString("base64url");

  // Step 4: Verify
  const fullJWS = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  await compactVerify(fullJWS, key); // throws if invalid

  console.log("✅ Signature is valid");
};
