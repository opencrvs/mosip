import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { mosipHandler, mosipNidSchema } from "./webhooks/mosip";
import { opencrvsHandler, opencrvsRecordSchema } from "./webhooks/opencrvs";
import { env } from "./constants";
import * as openapi from "./openapi-documentation";
import { getOIDPUserInfo, OIDPUserInfoSchema } from "./esignet-api";
import formbody from "@fastify/formbody";

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

openapi.register(app);

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.status(500).send({ error: "An unexpected error occurred" });
});

app.after(() => {
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/webhooks/opencrvs",
    method: "POST",
    handler: opencrvsHandler,
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
    handler: getOIDPUserInfo,
    schema: {
      body: OIDPUserInfoSchema,
    },
  });
});

async function run() {
  await app.ready();
  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  console.log(
    `OpenCRVS-MOSIP server running at http://${env.HOST}:${env.PORT}`
  );
  console.log(
    `Swagger UI running at http://${env.HOST}:${env.PORT}/documentation`
  );
}

void run();
