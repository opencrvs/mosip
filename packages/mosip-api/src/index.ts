import Fastify, { FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { mosipHandler, mosipNidSchema } from "./routes/mosip";
import {
  registrationEventHandler,
  opencrvsRecordSchema,
} from "./routes/event-registration";
import { env } from "./constants";
import * as openapi from "./openapi-documentation";
import { OIDPUserInfoSchema, OIDPQuerySchema } from "./esignet-api";
import formbody from "@fastify/formbody";
import { reviewEventHandler } from "./routes/event-review";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { getPublicKey } from "./opencrvs-api";
import { OIDPUserInfoHandler } from "./routes/oidp-user-info";

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
};

const initRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/events/registration",
    method: "POST",
    handler: registrationEventHandler,
    schema: {
      body: opencrvsRecordSchema,
    },
  });
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/events/review",
    method: "POST",
    handler: reviewEventHandler,
    schema: {
      body: opencrvsRecordSchema,
    },
  });
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/webhooks/mosip",
    method: "POST",
    handler: mosipHandler,
    schema: {
      body: mosipNidSchema,
    },
  });
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/esignet/get-oidp-user-info",
    method: "POST",
    // @TODO: @Tahmid, @Euan, is JWT authentication needed in E-Signet? Does HTTP button support it?
    handler: OIDPUserInfoHandler,
    schema: {
      body: OIDPUserInfoSchema,
      querystring: OIDPQuerySchema,
    },
  });
};

export const buildFastify = async () => {
  const app = Fastify({
    logger: envToLogger[env.isProd ? "production" : "development"],
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(formbody);
  app.register(cors, {
    origin: [env.CLIENT_APP_URL],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  openapi.register(app);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(500).send({ error: "An unexpected error occurred" });
  });

  app.register(jwt, {
    secret: { public: await getPublicKey() },
    verify: { algorithms: ["RS256"] },
  });

  app.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.after(() => initRoutes(app));

  return app;
};

async function run() {
  // Only run the daemon if it's executed directly - as in `tsx index.ts` for example
  if (require.main !== module) {
    return;
  }

  const app = await buildFastify();

  await app.ready();
  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  console.log(`OpenCRVS-MOSIP API running at http://${env.HOST}:${env.PORT}`);
  console.log(
    `Swagger UI running at http://${env.HOST}:${env.PORT}/documentation`,
  );
}

void run();
