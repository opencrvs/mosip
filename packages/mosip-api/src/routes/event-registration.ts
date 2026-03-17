import { FastifyRequest, FastifyReply } from "fastify";
import * as mosip from "../mosip-api";
import { generateTransactionId } from "../registration-number";
import { insertTransaction } from "../database";
import z from "zod";

const BirthRequestFieldsSchema = z.looseObject({
  birthCertificateNumber: z.string(),
  deathCertificateNumber: z.undefined().optional(),
});

const DeathRequestFieldsSchema = z.looseObject({
  deathCertificateNumber: z.string(),
  birthCertificateNumber: z.undefined().optional(),
});

const MosipNotificationSchema = z.object({
  recipientFullName: z.string(),
  recipientEmail: z.string(),
  recipientPhone: z.string(),
});

export const MosipInteropPayloadSchema = z.object({
  trackingId: z.string(),
  notification: MosipNotificationSchema,
  requestFields: z.union([BirthRequestFieldsSchema, DeathRequestFieldsSchema]),
  metaInfo: z.record(z.string(), z.unknown()),
  audit: z.record(z.string(), z.unknown()),
});

/** Handles the calls coming from OpenCRVS countryconfig */
export const registrationEventHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const body = MosipInteropPayloadSchema.parse(request.body);

  const { trackingId, requestFields, audit, metaInfo, notification } = body;

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
