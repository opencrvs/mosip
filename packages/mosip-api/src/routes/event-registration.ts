import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as mosip from "../mosip-api";
import {
  EVENT_TYPE,
  getComposition,
  getEventType,
  getTrackingId,
} from "../types/fhir";
import {
  generateRegistrationNumber,
  generateTransactionId,
} from "../registration-number";
import { insertTransaction } from "../database";

// bypass fhir payload validation as we are not sending fhir
export const opencrvsRecordSchema = z.unknown().describe("Record as any");

type IdentityInfo = { value: string; language: string };

interface MOSIPPayload
  extends Record<
    string,
    string | Record<string, boolean | string | IdentityInfo[]>
  > {
  compositionId: string;
  trackingId: string;
  notification: {
    recipientFullName: string;
    recipientEmail: string;
    recipientPhone: string;
  };
  requestFields: {
    fullName: IdentityInfo[];
    dateOfBirth: string;
    gender: IdentityInfo[];
    guardianOrParentName: IdentityInfo[];
    nationalIdNumber: string;
    passportNumber: string;
    drivingLicenseNumber: string;
    deceasedStatus: boolean;
    residenceStatus: IdentityInfo[];
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
  };
}

export type OpenCRVSRequest = FastifyRequest<{
  Body: MOSIPPayload;
}>;

/** Handles the calls coming from OpenCRVS countryconfig */
export const registrationEventHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply,
) => {
  const { trackingId, requestFields } = request.body;

  const token = request.headers.authorization!.split(" ")[1];

  request.log.info({ trackingId }, "Received record from OpenCRVS");

  const eventType = requestFields.deceasedStatus
    ? EVENT_TYPE.DEATH
    : EVENT_TYPE.BIRTH;

  if (eventType === EVENT_TYPE.BIRTH) {
    const transactionId = generateTransactionId();
    const registrationNumber = generateRegistrationNumber(trackingId);

    // const { workflowInstanceId } =
    await mosip.postBirthRecord({
      event: { id: transactionId, trackingId },
      token,
      request,
    });
    insertTransaction(transactionId, token, registrationNumber);

    // await opencrvs.upsertRegistrationIdentifier(
    //   {
    //     id: eventId,
    //     identifierType: "MOSIP_AID",
    //     identifierValue: aid,
    //   },
    //   { headers: { Authorization: `Bearer ${token}` } },
    // );
  }

  if (eventType === EVENT_TYPE.DEATH) {
    const transactionId = generateTransactionId();
    await mosip.deactivateNid({
      event: { id: transactionId, trackingId },
      request,
    });

    //   let nid;

    //   try {
    //     nid = getDeceasedNid(request.body);
    //   } catch (e) {
    //     request.log.info(
    //       `Couldn't find the deceased's NID. This is non-fatal - it likely wasn't submitted. Bypassing NID deactivation...`,
    //     );
    //   }

    //   let comment = "NID not entered for deactivation";

    //   if (nid) {
    //     const response = await mosip.deactivateNid({
    //       nid,
    //     });

    //     if (response.status === 404) {
    //       comment = `NID "${nid}" not found for deactivation`;
    //     } else if (response.status === 409) {
    //       comment = `NID "${nid}" already deactivated`;
    //     } else if (response.ok) {
    //       comment = `NID "${nid}" deactivated`;
    //     } else {
    //       throw new Error(
    //         `NID deactivation failed in MOSIP. Response: ${response.statusText}`,
    //       );
    //     }
    //   }

    //   const registrationNumber = generateRegistrationNumber(trackingId);

    //   // cannot confirm the registration at this point as we need to wait for the packet to process.
    //   // can do a upsert in here.
    //   await opencrvs.confirmRegistration(
    //     {
    //       id: eventId,
    //       registrationNumber,
    //       comment,
    //     },
    //     { headers: { Authorization: `Bearer ${token}` } },
    //   );
  }

  return reply.code(202).send();
};
