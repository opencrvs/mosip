import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as database from "../database";
import * as mosip from "../mosip-api";

const opencrvsRecordSchema = z
  .object({
    record: z.object({
      id: z.string(),
    }),
    token: z.string(),
  })
  .catchall(z.unknown());

type OpenCRVSRequest = FastifyRequest<{
  Body: z.infer<typeof opencrvsRecordSchema>;
}>;

export const opencrvsHandler = (
  request: OpenCRVSRequest,
  reply: FastifyReply
) => {
  const { record, token } = request.body;

  database.write(record.id, token);

  mosip.postRecord(record);

  reply.code(202).send({ status: "received" });
};
