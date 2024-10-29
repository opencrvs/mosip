import Fastify from "fastify";
import * as crypto from "crypto";
import { env } from "./constants";

type OpenCRVSEvent = {
  id: string;
  trackingId: string;
};

const createNid = async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const hash = crypto.createHash("sha256");
  return hash.digest("hex").substring(0, 16);
};

const sendNid = async ({
  token,
  eventId,
  trackingId,
}: {
  token: string;
  eventId: string;
  trackingId: string;
}) => {
  const nid = await createNid();
  const response = await fetch(env.OPENCRVS_MOSIP_GATEWAY_URL, {
    method: "POST",
    body: JSON.stringify({ nid, token, eventId, trackingId }),
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
    const { token, event } = request.body as {
      token: string;
      event: OpenCRVSEvent;
    };
    sendNid({ token, eventId: event.id, trackingId: event.trackingId });
    reply.status(202).send({ received: true });
  },
});

app.get("/esignet", {
  handler: async (request, reply) => {
    const { redirect_uri } = request.query as { redirect_uri: string };
    reply.redirect(redirect_uri);
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
