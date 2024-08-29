import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as mosip from "../mosip-api";
import { ValidRecord } from "@opencrvs/commons/types";

export const opencrvsRecordSchema = z.object({
  record: z
    .object({
      resourceType: z.enum(["Bundle"]),
      type: z.enum(["document"]),
      entry: z.array(z.unknown()),
    })
    .catchall(z.unknown())
    .describe("Record as FHIR Bundle"),
  token: z.string().describe("The one-time token from OpenCRVS"),
});
type OpenCRVSRequest = FastifyRequest<{
  Body: z.infer<typeof opencrvsRecordSchema> & { record: ValidRecord };
}>;

export const opencrvsHandler = (
  request: OpenCRVSRequest,
  reply: FastifyReply
) => {
  const { record, token } = request.body;

  mosip.postRecord({ record, token });

  reply.code(202).send({ status: "received" });
};
