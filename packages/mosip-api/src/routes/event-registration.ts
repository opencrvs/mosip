import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as mosip from "../mosip-api";
import { EVENT_TYPE } from "../types/fhir";
import * as opencrvs from "../opencrvs-api";
import { generateRegistrationNumber } from "../registration-number";

// bypass fhir payload validation as we are not sending fhir
export const opencrvsRecordSchema = z.unknown().describe("Record as any");

type IdentityInfo = { value: string; language: string };

interface MOSIPPayload
  extends Record<string, IdentityInfo[] | string | boolean> {
  compositionId: string;
  fullName: IdentityInfo[];
  dateOfBirth: string;
  gender: IdentityInfo[];
  guardianOrParentName: IdentityInfo[];
  nationalIdNumber: string;
  passportNumber: string;
  drivingLicenseNumber: string;
  deceasedStatus: boolean;
  residentStatus: IdentityInfo[];
  vid: string;
  email: string;
  phone: string;
  guardianOrParentBirthCertificateNumber: string;
  birthCertificateNumber: string;
  addressLine1: IdentityInfo[];
  addressLine2: IdentityInfo[];
  addressLine3: IdentityInfo[];
  district: IdentityInfo[];
  village: IdentityInfo[];
  birthRegistrationCertificate: string;
  passportId: string;
  nationalId: string;
  drivingLicenseId: string;
  addressProof: string;
}

export type OpenCRVSRequest = FastifyRequest<{
  Body: MOSIPPayload;
}>;

/** Handles the calls coming from OpenCRVS countryconfig */
export const registrationEventHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply,
) => {
  const { compositionId: eventId, ...requestFields } = request.body;

  const token = request.headers.authorization!.split(" ")[1];

  // We can trust the token as when `confirmRegistration` or `rejectRegistration` are called, the token is verified by OpenCRVS
  // This server should also only be deployed in the local network so no external calls can be made.

  // request.log.info({ trackingId }, "Received record from OpenCRVS");

  const eventType = requestFields.deceasedStatus
    ? EVENT_TYPE.DEATH
    : EVENT_TYPE.BIRTH;

  if (eventType === EVENT_TYPE.BIRTH) {
    const { aid } = await mosip.postBirthRecord({
      event: { id: eventId },
      token,
      request,
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
      nid = requestFields.nationalIdNumber;
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

    // TBD later
    // const registrationNumber = generateRegistrationNumber(trackingId);

    // await opencrvs.confirmRegistration(
    //   {
    //     id: eventId,
    //     registrationNumber,
    //     comment,
    //   },
    //   { headers: { Authorization: `Bearer ${token}` } },
    // );
  }

  return reply.code(202).send();
};
