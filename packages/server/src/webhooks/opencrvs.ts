import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as mosip from "../mosip-api";
import {
  getTaskFromSavedBundle,
  getTrackingId,
  ValidRecord,
} from "@opencrvs/commons/types";

export const opencrvsRecordSchema = z.object({
  record: z
    .object({
      resourceType: z.enum(["Bundle"]),
      type: z.enum(["document"]),
      entry: z.array(z.unknown()),
    })
    .catchall(z.unknown())
    .describe("Record as FHIR Bundle"),
  token: z.string().describe("One-time token from OpenCRVS"),
});
type OpenCRVSRequest = FastifyRequest<{
  Body: z.infer<typeof opencrvsRecordSchema> & { record: ValidRecord };
}>;

/** Handles the calls coming from OpenCRVS countryconfig */
export const opencrvsHandler = (
  request: OpenCRVSRequest,
  reply: FastifyReply
) => {
  const { record, token } = request.body;

  const trackingId = getTrackingId(record);

  mosip.postRecord({
    event: { id: record.id!, trackingId },
    token,
  });

  reply.code(202);
};
