import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

export const mosipNidSchema = z.object({
  record: z
    .object({
      resourceType: z.enum(["Bundle"]),
      type: z.enum(["document"]),
      entry: z.array(z.unknown()),
    })
    .catchall(z.unknown())
    .describe("Record as FHIR Bundle"),
  nid: z.string().describe("The identifier for the registration from MOSIP"),
  token: z
    .string()
    .describe(
      "The one-time token from OpenCRVS. MOSIP should pass this through without using it."
    ),
});

type MosipRequest = FastifyRequest<{
  Body: z.infer<typeof mosipNidSchema>;
}>;

export const mosipHandler = (request: MosipRequest, reply: FastifyReply) => {
  console.log("were actually back from MOSIP");
  reply.send({ draft: { token: request.body.nid } });
};
