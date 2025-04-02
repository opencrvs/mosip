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
import {
  generateRegistrationNumber,
  generateTransactionId,
} from "../registration-number";
import { insertTransaction } from "../database";

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
  const trackingId = getTrackingId(request.body);
  const { id: eventId } = getComposition(request.body);

  const token = request.headers.authorization!.split(" ")[1];

  request.log.info({ trackingId }, "Received record from OpenCRVS");

  const eventType = getEventType(request.body);

  if (eventType === EVENT_TYPE.BIRTH) {
    const transactionId = generateTransactionId();
    const registrationNumber = generateRegistrationNumber(trackingId);

    insertTransaction(transactionId, token, registrationNumber);

    await mosip.postBirthRecord({
      id: transactionId,
      registrationNumber,
    });
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
