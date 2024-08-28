import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { mosipHandler } from "./webhooks/mosip";
import { opencrvsHandler } from "./webhooks/opencrvs";
import { env } from "./constants";

const app = Fastify();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const route = app.withTypeProvider<ZodTypeProvider>();

route.post("/webhooks/opencrvs", opencrvsHandler);
route.post("/webhooks/mosip", mosipHandler);

async function run() {
  await app.ready();
  await app.listen({
    port: env.PORT,
  });

  console.log(`OpenCRVS-MOSIP gateway running at http://localhost:${env.PORT}`);
}

void run();
