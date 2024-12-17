import Fastify from "fastify";
import { env } from "./constants";
import jwt from "jsonwebtoken";

const app = Fastify({ logger: true });

const tokenRequestSchema = {
  body: {
    type: "object",
    required: ["code", "client_id", "redirect_uri", "grant_type"],
    properties: {
      code: { type: "string" },
      client_id: { type: "string" },
      redirect_uri: { type: "string" },
      grant_type: { type: "string" },
    },
  },
};

app.post("/oauth/token", {
//   schema: tokenRequestSchema,
  handler: async (request: any, reply) => {
    const payload = {
      code: request.body.code,
      client_id: request.body.client_id,
      redirect_uri: request.body.redirect_uri,
      grant_type: request.body.grant_type,
      client_assertion_type: request.body.client_assertion_type,
      client_assertion: request.body.client_assertion,
    };
    
    const accessToken = jwt.sign(payload, "mock-secret", {
      expiresIn: "1h",
    });

    return reply.send({
      access_token: accessToken,
      expires_in: "1h",
    });
  },
});

async function run() {
  await app.ready();
  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  console.log(`E-Signet mock server running at http://${env.HOST}:${env.PORT}`);
}

void run();
