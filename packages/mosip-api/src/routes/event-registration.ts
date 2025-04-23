import { FastifyRequest, FastifyReply } from "fastify";
import * as mosip from "../mosip-api";
import { EVENT_TYPE } from "../types/fhir";
import {
  generateRegistrationNumber,
  generateTransactionId,
} from "../registration-number";
import { insertTransaction } from "../database";
import * as opencrvs from "../opencrvs-api";
import { decode } from "jsonwebtoken";

interface MOSIPPayload {
  compositionId: string;
  trackingId: string;
  notification: {
    recipientFullName: string;
    recipientEmail: string;
    recipientPhone: string;
  };
  requestFields: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    guardianOrParentName: string;
    nationalIdNumber: string;
    passportNumber: string;
    drivingLicenseNumber: string;
    deceasedStatus: boolean;
    residenceStatus: string;
    vid: string;
    email: string;
    phone: string;
    guardianOrParentBirthCertificateNumber: string;
    birthCertificateNumber: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    district: string;
    village: string;
    birthRegistrationCertificate: string;
    passportId: string;
    nationalId: string;
    drivingLicenseId: string;
    addressProof: string;
    selectedHandles: string;
    UIN: string;
    deathDeclared: string;
    dateOfDeath: string;
  };
  audit: {
    uuid: string;
    createdAt: string;
    eventId: string;
    eventName: string;
    eventType: string;
    hostName: string;
    hostIp: string;
    applicationId: string;
    applicationName: string;
    sessionUserId: string;
    sessionUserName: string;
    id: string;
    idType: string;
    createdBy: string;
    moduleName: string;
    moduleId: string;
    description: string;
    actionTimeStamp: string;
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

    await mosip.postBirthRecord({
      event: { id: transactionId, trackingId },
      request,
    });

    insertTransaction(
      transactionId,
      token,
      requestFields.birthCertificateNumber,
    );
  }

  if (eventType === EVENT_TYPE.DEATH) {
    const transactionId = generateTransactionId();
    const { recordId } = decode(token) as { recordId: string };

    await mosip.deactivateNid({
      event: { id: transactionId, trackingId },
      request,
    });

    await opencrvs.confirmRegistration(
      {
        id: recordId,
        registrationNumber: generateRegistrationNumber(trackingId),
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  return reply.code(202).send();
};
