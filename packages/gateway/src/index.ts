import Fastify from "fastify";
import path from "path";
import { z } from "zod";

const fastify = Fastify();

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "../static"),
});

fastify.get("/", {
  handler: (request, reply) => {
    // @ts-expect-error sendFile is not available, fix
    reply.sendFile("index.html");
  },
});

fastify.get("/script.js", {
  handler: (request, reply) => {
    // @ts-expect-error sendFile is not available, fix
    reply.sendFile("script.js");
  },
});

// just some example stuff
// --------------------------------

const getUserSchema = z.object({
  query: z.object({
    id: z.string().uuid(),
  }),
});

fastify.get("/opencrvs-callback", {
  schema: {
    querystring: getUserSchema.shape.query,
  },
  handler: (request, reply) => {
    const query = request.query as z.infer<typeof getUserSchema.shape.query>;
    reply.send({ id: query.id, name: "John Doe" });
  },
});

// ---

const oidpSchema = z.object({
  body: z.object({
    token: z.string(),
  }),
});

fastify.get("/oidp", {
  schema: {
    body: oidpSchema.shape.body,
  },
  handler: (request, reply) => {
    const body = request.body as z.infer<typeof oidpSchema.shape.body>;
    reply.send({ draft: { token: body.token } });
  },
});

fastify.listen({ port: 2024 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Server running on http://localhost:2024");
});
