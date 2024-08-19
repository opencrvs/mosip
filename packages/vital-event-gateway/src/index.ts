import Fastify from "fastify";
import { z } from "zod";

const fastify = Fastify();

const getUserSchema = z.object({
  query: z.object({
    id: z.string().uuid(),
  }),
});

fastify.get("/v1/opencrvs-callback", {
  schema: {
    querystring: getUserSchema.shape.query,
  },
  handler: (request, reply) => {
    const query = request.query as z.infer<typeof getUserSchema.shape.query>;
    reply.send({ id: query.id, name: "John Doe" });
  },
});

fastify.listen({ port: 2024 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Server running on http://localhost:2024");
});
