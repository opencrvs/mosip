import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

const mosipNidSchema = z.object({
  recordId: z.string().uuid(),
  nid: z.string(),
});

type MosipRequest = FastifyRequest<{
  Body: z.infer<typeof mosipNidSchema>;
}>;

export const mosipHandler = (request: MosipRequest, reply: FastifyReply) => {
  console.log("were actually back from MOSIP");
  reply.send({ draft: { token: request.body.nid } });
};
