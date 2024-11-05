import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as mosip from "../mosip-api";
import { getComposition, getTrackingId } from "../types/fhir";
import * as opencrvs from "../opencrvs-api";

export const opencrvsRecordSchema = z
  .object({
    resourceType: z.enum(["Bundle"]),
    type: z.enum(["document"]),
    entry: z.array(z.unknown()),
  })
  .catchall(z.unknown())
  .describe("Record as FHIR Bundle");

type OpenCRVSRequest = FastifyRequest<{
  Body: fhir3.Bundle;
}>;

/** Handles the calls coming from OpenCRVS countryconfig */
export const opencrvsHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply
) => {
  // We will receive the full bundle, but we will minimize the amount of data we send to MOSIP

  const trackingId = getTrackingId(request.body);
  const { id: eventId } = getComposition(request.body);

  if (!request.headers.authorization) {
    return reply.code(401).send({ error: "Authorization header is missing" });
  }

  const token = request.headers.authorization.split(" ")[1];
  if (!token) {
    return reply
      .code(401)
      .send({ error: "Token is missing in Authorization header" });
  }

  // We can trust the token as when `confirmRegistration` or `rejectRegistration` are called, the token is verified by OpenCRVS
  // This server should also only be deployed in the local network so no external calls can be made.

  request.log.info({ trackingId }, "Received record from OpenCRVS");

  const { aid } = await mosip.postRecord({
    event: { id: eventId, trackingId },
    token,
  });

  await opencrvs.upsertRegistrationIdentifier(
    {
      eventId,
      identifierType: "MOSIP_AID",
      identifierValue: aid,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return reply.code(202).send();
};
