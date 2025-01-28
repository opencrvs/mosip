import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as opencrvs from "../opencrvs-api";
import { generateRegistrationNumber } from "../registration-number";
import { decryptData } from "../crypto/decrypt";

/** Encrypted payload from MOSIP */
export const mosipNidSchema = z.string();

type MosipRequest = FastifyRequest<{
  Body: z.infer<typeof mosipNidSchema>;
}>;

/** Handles the calls coming from MOSIP */
export const receiveNidHandler = async (
  request: MosipRequest,
  reply: FastifyReply,
) => {
  if (!request.headers.authorization) {
    return reply.code(401).send({ error: "Authorization header is missing" });
  }

  const token = request.headers.authorization.split(" ")[1];
  if (!token) {
    return reply
      .code(401)
      .send({ error: "Token is missing in Authorization header" });
  }

  const { eventId, uinToken, trackingId } = await decryptData(request.body);
  const registrationNumber = generateRegistrationNumber(trackingId);

  await opencrvs.confirmRegistration(
    {
      id: eventId,
      registrationNumber,
      identifiers: [{ type: "NATIONAL_ID", value: uinToken }],
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  reply.code(200);
};
