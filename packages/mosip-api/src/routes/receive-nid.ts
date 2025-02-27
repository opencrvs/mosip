import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as opencrvs from "../opencrvs-api";
import { decryptData } from "@opencrvs/mosip-crypto";
import { CREDENTIAL_PARTNER_PRIVATE_KEY } from "../mosip-api";
import { getRecordId } from "../token";

/** Encrypted payload from MOSIP */
export const mosipNidSchema = z.object({
  data: z.string(),
  signature: z.string(),
});

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

  const recordId = getRecordId(token);
  const { uinToken, opencrvsBRN } = decryptData(
    request.body.data,
    CREDENTIAL_PARTNER_PRIVATE_KEY,
  );

  await opencrvs.confirmRegistration(
    {
      id: recordId,
      registrationNumber: opencrvsBRN,
      identifiers: [{ type: "NATIONAL_ID", value: uinToken }],
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  reply.code(200);
};
