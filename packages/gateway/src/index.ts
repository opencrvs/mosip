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

const app = Fastify();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

openapi.register(app);

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
});

async function run() {
  await app.ready();
  await app.listen({
    port: env.PORT,
  });

  console.log(`OpenCRVS-MOSIP gateway running at http://localhost:${env.PORT}`);
  console.log(
    `Swagger UI running at http://localhost:${env.PORT}/documentation`
  );
}

void run();
