import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { mosipNidSchema, receiveNidHandler } from "./routes/receive-nid";
import {
  registrationEventHandler,
  opencrvsRecordSchema,
} from "./routes/event-registration";
import { env } from "./constants";
import * as openapi from "./openapi-documentation";
import {
  getOIDPUserInfo,
  OIDPUserInfoSchema,
  OIDPQuerySchema,
} from "./esignet-api";
import formbody from "@fastify/formbody";
import { reviewEventHandler } from "./routes/event-review";
import cors from "@fastify/cors";

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

app.after(() => {
  /*
   * OpenCRVS country-config receivers
   */
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

  /*
   * MOSIP Java Mediator receiver
   */
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/birthReceiveNid",
    method: "POST",
    handler: receiveNidHandler,
    schema: {
      body: mosipNidSchema,
    },
  });

  /*
   * E-Signet OIDP user info handler
   */
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/esignet/get-oidp-user-info",
    method: "POST",
    handler: getOIDPUserInfo,
    schema: {
      body: OIDPUserInfoSchema,
      querystring: OIDPQuerySchema,
    },
  });
});

async function run() {
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
