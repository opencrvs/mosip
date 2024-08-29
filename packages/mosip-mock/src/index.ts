import Fastify from "fastify";
import * as crypto from "crypto";
import { env } from "./constants";

const createNid = async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const hash = crypto.createHash("sha256");
  return hash.digest("hex").substring(0, 16);
};

const sendNid = async ({ token, record }: { token: string; record: any }) => {
  const nid = await createNid();
  const response = await fetch(env.OPENCRVS_MOSIP_GATEWAY_URL, {
    method: "POST",
    body: JSON.stringify({ nid, token, record }),
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
    const { token, record } = request.body as { token: string; record: any };
    sendNid({ token, record });
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
