import { DateValue, NameFieldValue, TextValue } from "@opencrvs/toolkit/events";
import { FastifyReply, FastifyRequest } from "fastify";
import { verifyNid } from "../mosip-api";
import { z } from "zod";

export const VerifySchema = z.object({
  nid: TextValue,
  dob: DateValue,
  name: NameFieldValue,
  gender: TextValue.optional(),
  transactionId: z.string().optional(),
});

export type OpenCRVSRequest = FastifyRequest<{
  Body: z.infer<typeof VerifySchema>;
}>;

/** Handles the calls coming from OpenCRVS countryconfig */
export const verifyHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply,
) => {
  const {
    response: { authStatus },
  } = await verifyNid({
    nid: request.body.nid,
    dob: request.body.dob.replaceAll("-", "/"),
    name: [
      {
        language: "eng",
        value: `${request.body.name.firstname} ${request.body.name.surname}`,
      },
    ],
    gender: request.body.gender
      ? [{ language: "eng", value: request.body.gender }]
      : undefined,
  });

  const transactionId = request.body.transactionId;

  if (transactionId) {
    request.log.info({ transactionId, authStatus });
  }

  return reply.code(200).send(authStatus ? "verified" : "failed");
};
