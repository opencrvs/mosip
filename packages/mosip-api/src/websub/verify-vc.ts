import vc from "@digitalbazaar/vc";
import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { securityLoader } from "@digitalbazaar/security-document-loader";

export const verifyCredentialOrThrow = async (
  credential: any, // you can run it through your Zod schema first if you want
  { allowList }: { allowList: string[] },
) => {
  const { verificationMethod } = credential.proof;

  if (!allowList.includes(verificationMethod)) {
    throw new Error("❌ Verification method not allowed");
  }

  // Load public key (usually you'd fetch this from verificationMethod URI or a DID)
  const key = await Ed25519VerificationKey2020.from({
    id: verificationMethod,
    controller: credential.issuer,
    publicKeyMultibase: "<your-public-key-multibase-here>", // Replace with actual key
  });

  const suite = new Ed25519Signature2020({ key });

  const documentLoader = securityLoader().build();

  const result = await vc.verifyCredential({
    credential,
    suite,
    documentLoader,
  });

  if (!result.verified) {
    throw new Error("❌ VC verification failed");
  }

  return result;
};
