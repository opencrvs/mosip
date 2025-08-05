import { FastifyRequest, FastifyReply } from "fastify";
import * as mosip from "../mosip-api";
import { generateTransactionId } from "../registration-number";
import { insertTransaction } from "../database";

interface MOSIPPayload {
  compositionId: string;
  trackingId: string;
  notification: {
    recipientFullName: string;
    recipientEmail: string;
    recipientPhone: string;
  };
  requestFields: Partial<{
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
    deathCertificateNumber: string;
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
  }>;
  metaInfo: {
    metaData: string;
    registrationId: string;
    operationsData: string;
    capturedRegisteredDevices: string;
    creationDate: string;
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

interface MOSIPBirthPayload extends MOSIPPayload {
  requestFields: MOSIPPayload["requestFields"] & {
    birthCertificateNumber: string;
  };
}

interface MOSIPDeathPayload extends MOSIPPayload {
  requestFields: MOSIPPayload["requestFields"] & {
    deathCertificateNumber: string;
  };
}

export type OpenCRVSBirthRequest = FastifyRequest<{
  Body: MOSIPBirthPayload;
}>;

export type OpenCRVSDeathRequest = FastifyRequest<{
  Body: MOSIPDeathPayload;
}>;

/** Handles the birth events coming from OpenCRVS country config */
export const birthRegistrationHandler = async (
  request: OpenCRVSBirthRequest,
  reply: FastifyReply,
) => {
  const { trackingId, requestFields } = request.body;

  const token = request.headers.authorization!.split(" ")[1];

  request.log.info({ trackingId }, "Received record from OpenCRVS");

  const transactionId = generateTransactionId();

  request.log.info({ transactionId }, "Event ID");

  await mosip.postBirthRecord({
    event: { id: transactionId, trackingId },
    request,
  });

  insertTransaction(transactionId, token, requestFields.birthCertificateNumber);

  return reply.code(202).send();
};

/** Handles the death events coming from OpenCRVS country config */
export const deathRegistrationHandler = async (
  request: OpenCRVSDeathRequest,
  reply: FastifyReply,
) => {
  const { trackingId, requestFields } = request.body;

  const token = request.headers.authorization!.split(" ")[1];

  request.log.info({ trackingId }, "Received record from OpenCRVS");

  const transactionId = generateTransactionId();

  request.log.info({ transactionId }, "Event ID");

  await mosip.postDeathRecord({
    event: { id: transactionId, trackingId },
    request,
  });

  insertTransaction(transactionId, token, requestFields.deathCertificateNumber);

  return reply.code(202).send();
};
