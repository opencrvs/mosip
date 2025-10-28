import { FastifyRequest, FastifyReply } from "fastify";
import * as mosip from "../mosip-api";
import { generateTransactionId } from "../registration-number";
import { insertTransaction } from "../database";
import { MosipInteropPayload } from "@opencrvs/mosip/api";

export type OpenCRVSRequest = FastifyRequest<{
  Body: MosipInteropPayload;
}>;

/** Handles the calls coming from OpenCRVS countryconfig */
export const registrationEventHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply,
) => {
  const { trackingId, requestFields, audit, metaInfo, notification } =
    request.body;

  const token = request.headers.authorization!.split(" ")[1];

  request.log.info({ trackingId }, "Received record from OpenCRVS");

  const birthCertificateNumber = requestFields.birthCertificateNumber;

  if (birthCertificateNumber) {
    const transactionId = generateTransactionId();

    request.log.info({ transactionId }, "Event ID");

    insertTransaction(transactionId, token, birthCertificateNumber);

    await mosip.postBirthRecord({
      event: { id: transactionId, trackingId },
      requestFields,
      audit,
      metaInfo,
      notification,
    });
  }

  const deathCertificateNumber = requestFields.deathCertificateNumber;

  if (deathCertificateNumber) {
    const transactionId = generateTransactionId();

    request.log.info({ transactionId }, "Event ID");

    insertTransaction(transactionId, token, deathCertificateNumber);

    await mosip.postDeathRecord({
      event: { id: transactionId, trackingId },
      requestFields,
      audit,
      metaInfo,
      notification,
    });
  }

  return reply.code(202).send({});
};
