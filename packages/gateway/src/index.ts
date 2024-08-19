import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import fastifyStatic from "@fastify/static";
import path from "path";
import { z } from "zod";

const app = Fastify();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyStatic, {
  root: path.join(__dirname, "../static"),
});

app.get("/", {
  handler: (request, reply) => {
    reply.sendFile("index.html");
  },
});

const oidpSchema = z.object({
  token: z.string(),
});

app.withTypeProvider<ZodTypeProvider>().post("/oidp", {
  schema: {
    body: oidpSchema,
  },
  handler: (request, reply) => {
    reply.send({ draft: { token: request.body.token } });
  },
});

async function run() {
  await app.ready();
  await app.listen({
    port: 2024,
  });

  console.log(`OpenCRVS-MOSIP gateway running at http://localhost:2024/`);
}

void run();
