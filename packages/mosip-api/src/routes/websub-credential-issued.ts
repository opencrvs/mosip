import { z } from "zod";
import { env } from "../constants";
import { FastifyReply, FastifyRequest } from "fastify";
import { getTransactionAndDiscard } from "../database";
import { decode } from "jsonwebtoken";
import * as opencrvs from "../opencrvs-api";
import { decryptMosipCredential } from "../websub/crypto";

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
  // topic: z.literal(env.MOSIP_WEBSUB_TOPIC),
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
      proof: z.object({
        signature: z.string(),
      }),
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
    credentialSubject: { VID, id },
  } = decryptMosipCredential(request.body.event.data.credential);
  const { token, registrationNumber } = getTransactionAndDiscard(id);
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
