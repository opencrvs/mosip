import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as opencrvs from "../opencrvs-api";
import { generateRegistrationNumber } from "../registration-number";
import { getTransactionAndDiscard } from "../database";

export const mosipNidSchema = z.object({
  request: z.object({
    id: z
      .string()
      .describe("The tracking ID for the event (record) from OpenCRVS"),
  }),
  nid: z.string().describe("The identifier for the registration from MOSIP"),
});

type MosipRequest = FastifyRequest<{
  Body: z.infer<typeof mosipNidSchema>;
}>;

/** Handles the calls coming from MOSIP */
export const mosipHandler = async (
  request: MosipRequest,
  reply: FastifyReply,
) => {
  const {
    request: { id: transactionId },
    nid,
  } = request.body;
  const registrationNumber = generateRegistrationNumber(trackingId);

  const token = getTransactionAndDiscard();

  await opencrvs.confirmRegistration(
    {
      id: eventId,
      registrationNumber,
      identifiers: [{ type: "NATIONAL_ID", value: nid }],
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  reply.code(200);
};
