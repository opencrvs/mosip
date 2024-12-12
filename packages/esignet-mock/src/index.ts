import Fastify from "fastify";
import { env } from "./constants";

const app = Fastify();

app.get("/test/get", async (request, reply) => {
  return { message: "Execution Successfull!" };
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
