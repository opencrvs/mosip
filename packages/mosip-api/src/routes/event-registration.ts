import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as mosip from "../mosip-api";
import {
  EVENT_TYPE,
  getDeceasedNid,
  getComposition,
  getEventType,
  getTrackingId,
} from "../types/fhir";
import * as opencrvs from "../opencrvs-api";
import { generateRegistrationNumber } from "../registration-number";

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
export const registrationEventHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply,
) => {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const trackingId = getTrackingId(request.body);
  const { id: eventId } = getComposition(request.body);

  const token = request.headers.authorization!.split(" ")[1];

  // We can trust the token as when `confirmRegistration` or `rejectRegistration` are called, the token is verified by OpenCRVS
  // This server should also only be deployed in the local network so no external calls can be made.

  request.log.info({ trackingId }, "Received record from OpenCRVS");

  const eventType = getEventType(request.body);

  if (eventType === EVENT_TYPE.BIRTH) {
    const { aid } = await mosip.postBirthRecord({
      event: { id: eventId, trackingId },
      token,
    });

    await opencrvs.upsertRegistrationIdentifier(
      {
        id: eventId,
        identifierType: "MOSIP_AID",
        identifierValue: aid,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  if (eventType === EVENT_TYPE.DEATH) {
    let nid;

    try {
      nid = getDeceasedNid(request.body);
    } catch (e) {
      request.log.info(
        `Couldn't find the deceased's NID. This is non-fatal - it likely wasn't submitted. Bypassing NID deactivation...`,
      );
    }

    let comment = "NID not entered for deactivation";

    if (nid) {
      const response = await mosip.deactivateNid({
        nid,
      });

      if (response.status === 404) {
        comment = `NID "${nid}" not found for deactivation`;
      } else if (response.status === 409) {
        comment = `NID "${nid}" already deactivated`;
      } else if (response.ok) {
        comment = `NID "${nid}" deactivated`;
      } else {
        throw new Error(
          `NID deactivation failed in MOSIP. Response: ${response.statusText}`,
        );
      }
    }

    const registrationNumber = generateRegistrationNumber(trackingId);

    await opencrvs.confirmRegistration(
      {
        id: eventId,
        registrationNumber,
        comment,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  return reply.code(202).send();
};
