import * as vc from "@digitalbazaar/vc";
import { z } from "zod";
import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { securityLoader } from "@digitalbazaar/security-document-loader";

const BirthSubject = z.object({
  birthCertificateNumber: z.string(),
  VID: z.string(),
  id: z.string().url(),
  vcVer: z.literal("VC-V1"),
});

const DeathSubject = z.object({
  id: z.string().url(),
  vcVer: z.literal("VC-V1"),
});

export const isBirthSubject = (
  subject: z.infer<typeof BirthSubject> | z.infer<typeof DeathSubject>,
): subject is z.infer<typeof BirthSubject> => {
  return "birthCertificateNumber" in subject && "VID" in subject;
};

export const MOSIPVerifiableCredential = z.object({
  issuanceDate: z.string().datetime(),
  credentialSubject: z.union([BirthSubject, DeathSubject]),
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
  credential: any, // you can run it through your Zod schema first if you want
  { allowList }: { allowList: string[] },
) => {
  const { verificationMethod } = credential.proof;

  // if (!allowList.includes(verificationMethod)) {
  //   throw new Error("❌ Verification method not allowed");
  // }

  const publicKey =
    "-----BEGIN PUBLIC KEY-----\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw34EhsyQFAbB+jideCNO\r\n2HXAMQDR4NnwsVNQVcV8OxieMhi1pSreJZ8dt/MsgmdI3AW53WQ4ltXiZwdQ1Q/L\r\nm2t2kzFNAY57o8KG/V9sQIc5/oKH+G2y3+gotR+TaWxAg3RvSPG6X2KMSpKA4UB4\r\n+JVuqQNNZLdzGwVCf5+SMvjiamOX5xRnyyjhPJGKloykOIfmKaDRrXmV5QX5Lapk\r\nmy0GoAWIB96JpznDOFQlRMVGMKXr2crlxeHPBjiEm70ZnFpIGaacxCaFnuxWcCeb\r\nIoPufZaF7CkwVoSfKNltztsAgQkDUKO/kZ3hlxjj6do1f35Ow8mxU/RnSrq3mgFW\r\nWQIDAQAB\r\n-----END PUBLIC KEY-----";
  const keyPair = await Ed25519VerificationKey2020.generate({
    id: '"https://dev-api.identity.gov.to/.well-known/public-key.json"',
    controller: "https://dev-api.identity.gov.to/.well-known/controller.json",
    publicKeyPem: publicKey,
  });
  const key = await Ed25519VerificationKey2020.from({
    id: verificationMethod,
    controller: credential.issuer,
    publicKeyMultibase: keyPair.publicKeyMultibase,
  });

  const suite = new Ed25519Signature2020({ key });

  const documentLoader = securityLoader().build();

  const result = await vc.verifyCredential({
    credential,
    suite,
    documentLoader,
  });

  console.log("result", result);
  if (!result.verified) {
    throw new Error("❌ VC verification failed");
  }

  return result;
};
