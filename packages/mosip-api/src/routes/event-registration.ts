import { FastifyRequest, FastifyReply } from "fastify";
import * as mosip from "../mosip-api";
import { generateTransactionId } from "../registration-number";
import { insertTransaction } from "../database";
import { MosipInteropPayload } from "@opencrvs/mosip/api";
import { env } from "../constants";

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

  if (!env.isProd) {
    const host = request.headers.host;
    const baseUrl = host
      ? `${request.protocol}://${host}`
      : `http://${env.HOST}:${env.PORT}`;
    const body = JSON.stringify(request.body).replace(/'/g, "'\\''");
    const curl = `curl -X POST "${baseUrl}/events/registration" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" --data-raw '${body}'`;

    request.log.info({ trackingId, curl }, "Dev retry curl");
  }

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
