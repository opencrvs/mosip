import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { env } from "../constants";
import test, { it } from "node:test";
import {
  MOSIPVerifiableCredential,
  verifyCredentialOrThrow,
} from "./verify-vc";
import { z } from "zod";
import assert from "node:assert";

const mswServer = setupServer(
  http.get("https://legitimate.mosip.dev/.well-known/public-key.json", () => {
    return HttpResponse.json({
      "@context": "https://w3id.org/security/v2",
      type: "RsaVerificationKey2018",
      id: "http://localhost:20240/.well-known/public-key.json",
      controller: "http://localhost:20240/.well-known/controller.json",
      publicKeyPem:
        "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAndtTYygA+5pGhAv2OWQd\nYBTaCbqjyF0pV9qCw3DbCAhPY247IVDIJ1zlNnxYnEYiL5/+39owPgRsczry0kCb\nSGlNGMJ7ufPoaT93ULM8YpujT6x7m4q6zGLTTg0cVQtbdAp+szSg2RDEF9JnDlFg\nvdfQ46Hxkt7kXBwWw1IOS4XbUrRbRLkjL7SskJERuqZYq/V6BNzqjeuHyQtpttQB\nkACdnh0mhbwNkMqjKrC2lmSibmlp1xwT/BKNSeuhWH+cbL1JN5CRKFG1wxsbi74R\nlbB9dIvkVxs0rl0AQgy0bVJhuHYmG/3Yz2dhwKPwdwW5gE3QwT1UjU3KmI+GgJVA\nGQIDAQAB\n-----END PUBLIC KEY-----\n",
    });
  }),
);
mswServer.listen();

// created logging `mosip-mock` output
const VALID_CREDENTIAL = {
  issuanceDate: "2025-04-11T07:57:43.134Z",
  credentialSubject: {
    birthCertificateNumber: "C83B023548BST",
    VID: "8031687218",
    id: "http://credential.idrepo/credentials/100010033575073",
    vcVer: "VC-V1",
  },
  id: "http://credential.idrepo/credentials/3b45aa17-dfd1-432e-ab29-c0be39cb55f7",
  proof: {
    type: "RsaSignature2018",
    created: "2025-04-11T07:57:43.134Z",
    proofPurpose: "assertionMethod",
    verificationMethod:
      "https://legitimate.mosip.dev/.well-known/public-key.json",
    jws: "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il0sImtpZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MjAyNDAvLndlbGwta25vd24vcHVibGljLWtleS5qc29uIn0..ZLUWGWVP3FrwTgVbcmaM2nb_ZcW4nWTcTflf1Zh-fieudW1BpqdH2LIpzzqvOeG1M4evJZEuJH2tlf4YxxUbN06r9ckz1PyaIjauCGlrwl1YCELUlbYoaCbLjHvZ96VgSFGzkRI6f3QiAYRi_SfgoEuAdRpve1xeIUFcFhCdxV94FTHovzoSWhOgd2KO3tQC_Ae2n2iv9cF07kCguqsCtDfsoGs775USW3JQE9rFYxg02w04qXn1RbMBLjpm6JZrG-jt-_h--HvNykUVO0wnmCMWtB4Rds3yD5EGe2CWwQ94RJBON3v5phMW_G0yAQ_TMB3Ogv7DpRv-VxhfY0FpkA",
  },
  type: ["VerifiableCredential", "MOSIPVerifiableCredential"],
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "http://localhost:20240/.well-known/mosip-context.json",
    {
      sec: "https://w3id.org/security#",
    },
  ],
  issuer: "http://localhost:20240/.well-known/controller.json",
} satisfies z.infer<typeof MOSIPVerifiableCredential>;

const INVALID_JWS_CREDENTIAL = {
  ...VALID_CREDENTIAL,
  proof: {
    ...VALID_CREDENTIAL.proof,
    // created logging a deployed MOSIP dev environment
    jws: "eyJiNjQiOmZhbHNlLCJjcml0IjpbImI2NCJdLCJraWQiOiJ2OU4zMl9wbGlpdDZmWWt4VU5rVXNQLWVhZUhiM0RzWEJWdXpiQ3VhcHhNIiwiYWxnIjoiUFMyNTYifQ..OP0taxlU5cAcX7G8zYp-z_oaofiumftk_fWxN0S2sjQtxgx4JsLr1q6yElsKbYgbnSoLAKAmigQKWCAijnipYPccFIufRgMF5Gha3Kwr99Sg0XEG3PbwWoBMa_YVHe0CSE0oALwlejRmVQNA3rpfKxlrSqy9VV1FL0OwiE6X7MdxHnbxqbR11cZd2WT71bANPuj5CqdDN-SWr5urDjKDUntYvDC_SVy2o5FPXoi4BLvvbW5Uy6M4APDNKf3d3JoPXJPJd-JlP_tv-x-bY-V8mVwIG88cdYJLh2MFgE1sUJhxeBuAAT1jHxyCSe7PReTpbBltV1vsg5HvJwq7QKkaoQ",
  },
};

const SPOOFED_CREDENTIAL = {
  ...VALID_CREDENTIAL,
  proof: {
    ...VALID_CREDENTIAL.proof,
    verificationMethod:
      "https://illegitimate-attacker.mosip.dev/.well-known/public-key.json",
  },
} satisfies z.infer<typeof MOSIPVerifiableCredential>;

it("verifies a valid credential", async () => {
  await assert.doesNotReject(() =>
    verifyCredentialOrThrow(VALID_CREDENTIAL, {
      allowList: ["https://legitimate.mosip.dev/.well-known/public-key.json"],
    }),
  );
});

it("throws on invalid credential: jws signed with different private key", async () => {
  await assert.rejects(() =>
    verifyCredentialOrThrow(INVALID_JWS_CREDENTIAL, {
      allowList: ["https://legitimate.mosip.dev/.well-known/public-key.json"],
    }),
  );
});

it("throws on invalid credential: non-allowed verification method url", async () => {
  await assert.rejects(() =>
    verifyCredentialOrThrow(SPOOFED_CREDENTIAL, {
      allowList: ["https://legitimate.mosip.dev/.well-known/public-key.json"],
    }),
  );
});
