import { z } from "zod";
import { FastifyReply, FastifyRequest } from "fastify";
import { getTransactionAndDiscard } from "../database";
import { decode } from "jsonwebtoken";
import * as opencrvs from "../opencrvs-api";
import { decryptMosipCredential } from "../websub/crypto";
import { MOSIP_VERIFIABLE_CREDENTIAL_ALLOWED_URLS, env } from "../constants";
import { isBirthSubject, verifyCredentialOrThrow } from "../websub/verify-vc";

export const CredentialIssuedSchema = z.object({
  publisher: z.string(),
  topic: z.literal(env.MOSIP_WEBSUB_TOPIC),
  publishedOn: z.string().datetime(),
  event: z.object({
    id: z.string().uuid(),
    transactionId: z.string().uuid(),
    type: z.object({
      namespace: z.string(),
      name: z.string(),
    }),
    timestamp: z.string().datetime(),
    data: z.object({
      registrationId: z.string(),
      credential: z.string(),
      credentialType: z.literal("vercred"),
      protectionKey: z.string(),
    }),
  }),
});

type CredentialIssuedRequest = FastifyRequest<{
  Body: z.infer<typeof CredentialIssuedSchema>;
}>;

export const credentialIssuedHandler = async (
  request: CredentialIssuedRequest,
  reply: FastifyReply,
) => {
  const verifiableCredential = decryptMosipCredential(
    request.body.event.data.credential,
  );

  // commented out for now, as there is an issue when verifying the VC
  // await verifyCredentialOrThrow(verifiableCredential, {
  //   allowList: MOSIP_VERIFIABLE_CREDENTIAL_ALLOWED_URLS,
  // });

  const transactionId = verifiableCredential.credentialSubject.id
    .split("/")
    .pop()!;

  const { token, registrationNumber } = getTransactionAndDiscard(transactionId);
  const { recordId } = decode(token) as { recordId: string };

  if (isBirthSubject(verifiableCredential.credentialSubject)) {
    await opencrvs.confirmRegistration(
      {
        id: recordId,
        registrationNumber,
        identifiers: [
          {
            type: "NATIONAL_ID",
            value: verifiableCredential.credentialSubject.VID,
          },
        ],
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } else {
    await opencrvs.confirmRegistration(
      {
        id: recordId,
        registrationNumber,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  return reply.send({ status: "RECEIVED" }).status(200);
};
