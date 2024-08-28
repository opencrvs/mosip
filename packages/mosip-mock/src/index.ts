import Fastify from "fastify";
import * as crypto from "crypto";
import { env } from "./constants";

const createNid = async ({ id }: { id: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const hash = crypto.createHash("sha256");
  hash.update(id);
  const randomString = hash.digest("hex").substring(0, 16);
  return randomString;
};

const sendNid = async ({ id }: { id: string }) => {
  const nid = await createNid({ id });
  const response = await fetch(env.OPENCRVS_MOSIP_GATEWAY_URL, {
    method: "POST",
    body: JSON.stringify({ nid }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to send NID to OpenCRVS. Status: ${
        response.status
      }, response: ${await response.text()}`
    );
  }

  return response.json();
};

const app = Fastify();

app.post("/webhooks/opencrvs", {
  handler: async (request, reply) => {
    const record = request.body as { id: string };

    console.log(JSON.stringify(record, null, 4));

    sendNid(record);

    reply.status(202).send({ received: true });
  },
});

async function run() {
  await app.ready();
  await app.listen({
    port: 20240,
  });

  console.log(`MOSIP mock running at http://localhost:20240/`);
}

void run();
