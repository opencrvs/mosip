import Fastify from "fastify";
import { env } from "./constants";
import { createAid, createNid } from "./random-identifiers";

type OpenCRVSEvent = {
  id: string;
  trackingId: string;
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
  const response = await fetch(env.OPENCRVS_MOSIP_SERVER_URL, {
    method: "POST",
    body: JSON.stringify({ nid, token, eventId, trackingId }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to send NID to OpenCRVS. Status: ${
        response.status
      }, response: ${await response.text()}`
    );
  }

  return response.text();
};

const app = Fastify();

app.post("/webhooks/opencrvs", {
  handler: async (request, reply) => {
    const { token, event } = request.body as {
      token: string;
      event: OpenCRVSEvent;
    };

    sendNid({ token, eventId: event.id, trackingId: event.trackingId }).catch(
      (e) => {
        console.error(e);
      }
    );

    return reply.status(202).send({
      aid: createAid(),
    });
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
    port: env.PORT,
    host: env.HOST,
  });

  console.log(`MOSIP mock server running at http://${env.HOST}:${env.PORT}`);
}

void run();
