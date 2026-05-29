import { flattenedVerify, importSPKI } from "jose";
import { z } from "zod";
import canonicalize from "canonicalize";
import { env } from "../constants";

const BirthSubject = z.looseObject({
  id: z.string(),
  [env.MOSIP_VERIFIABLE_CREDENTIAL_NATIONAL_ID_KEY]: z.string(),
});

export const getBirthIdentifier = (credentialSubject: BirthSubject) => {
  if (env.MOSIP_VERIFIABLE_CREDENTIAL_NATIONAL_ID_KEY in credentialSubject) {
    return credentialSubject[env.MOSIP_VERIFIABLE_CREDENTIAL_NATIONAL_ID_KEY];
  } else {
    throw new Error(
      `Invalid birth credential subject. Available keys: ${Object.keys(credentialSubject).join(", ")}`,
    );
  }
};

export type BirthSubject = z.infer<typeof BirthSubject>;

const DeathSubject = z.object({
  id: z.string(),
});

export type DeathSubject = z.infer<typeof DeathSubject>;

export const MOSIPVerifiableCredential = z.looseObject({
  id: z.url(),
  issuedTo: z.string(),
  issuanceDate: z.iso.datetime(),
  credentialSubject: z.union([BirthSubject, DeathSubject]),
  issuer: z.url(),
});
