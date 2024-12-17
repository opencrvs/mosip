import Fastify from "fastify";
import { EMAIL_ENABLED, env } from "./constants";
import { createAid, createNid } from "./random-identifiers";
import { sendEmail } from "./mailer";

type OpenCRVSBirthEvent = {
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
  console.log(
    `${JSON.stringify({ eventId, trackingId }, null, 4)}, creating NID...`
  );

  const nid = await createNid();
  console.log(
    `${JSON.stringify({ eventId, trackingId }, null, 4)}, ..."${nid}" created.`
  );

  await sendEmail(`NID created for tracking ID ${trackingId}`, `NID: ${nid}`);

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

app.post("/webhooks/opencrvs/birth", {
  handler: async (request, reply) => {
    const { token, event } = request.body as {
      token: string;
      event: OpenCRVSBirthEvent;
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

app.post("/webhooks/opencrvs/death", {
  handler: async (request, reply) => {
    const { nid } = request.body as {
      nid: string;
    };

    console.log(`${JSON.stringify({ nid }, null, 4)}, deactivating NID...`);

    sendEmail(`NID deactivated for ${nid}`, `NID deactivated: ${nid}`);

    return reply.status(202).send();
  },
});

async function run() {
  if (env.isProd) {
    console.error(
      "⚠️ You are running MOCK national ID server in production. All identifiers will be logged. ⚠️"
    );
  }

  await app.ready();
  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  const emailStatus = EMAIL_ENABLED
    ? "✅ Emails enabled"
    : "❌ Emails disabled";

  console.log(`MOSIP mock server running at http://${env.HOST}:${env.PORT}`);
  console.log(emailStatus);
}

void run();
