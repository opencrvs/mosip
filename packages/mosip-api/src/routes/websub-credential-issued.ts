import { z } from "zod";
import { env } from "../constants";
import { FastifyReply, FastifyRequest } from "fastify";
import { getTransactionAndDiscard } from "../database";
import { decode } from "jsonwebtoken";
import * as opencrvs from "../opencrvs-api";

export const Credential = z.object({
  id: z.string(),
  issuedTo: z.string(),
  issuanceDate: z.string().datetime(),
  credentialSubject: z.object({
    birthCertificateNumber: z.string(),
    VID: z.string(),
    id: z.string(),
  }),
  type: z.array(z.literal("MOSIPVerifiableCredential")),
});

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
      credential: Credential, // @TODO: Abdul is working on the encryption of this
      proof: z
        .object({
          signature: z.string(),
        })
        .optional(), // @TODO: Not going to be optional, Abdul is working on this
      credentialType: z.literal("euin"),
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
  const {
    event: {
      data: {
        registrationId: transactionId,
        credential: {
          credentialSubject: { VID },
        },
      },
    },
  } = request.body;

  const { token, registrationNumber } = getTransactionAndDiscard(transactionId);
  const { recordId } = decode(token) as { recordId: string };

  await opencrvs.confirmRegistration(
    {
      id: recordId,
      registrationNumber,
      identifiers: [{ type: "NATIONAL_ID", value: VID }],
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return reply.send({ status: "RECEIVED" }).status(200);
};
