import { RouteHandlerMethod } from "fastify";
import { createNid } from "../random-identifiers";
import { sendEmail } from "../mailer";
import { env } from "../constants";
import { encryptAndSignPacket, decryptData } from "@opencrvs/mosip-crypto";
import { readFileSync } from "node:fs";

export const CREDENTIAL_PARTNER_PRIVATE_KEY = readFileSync(
  env.CREDENTIAL_PARTNER_PRIVATE_KEY_PATH,
).toString();

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
    `${JSON.stringify({ eventId, trackingId }, null, 4)}, creating NID...`,
  );

  const nid = await createNid();
  console.log(
    `${JSON.stringify({ eventId, trackingId }, null, 4)}, ..."${nid}" created.`,
  );

  await sendEmail(`NID created for tracking ID ${trackingId}`, `NID: ${nid}`);

  const response = await fetch(env.OPENCRVS_MOSIP_API_URL, {
    method: "POST",
    body: JSON.stringify({ eventId, uinToken: nid, trackingId }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to send NID to OpenCRVS. Status: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }

  return response.text();
};

type OpenCRVSBirthEvent = {
  id: string;
  trackingId: string;
  requestTime: string;
  token: string;

  /** encrypted data */
  data: string;
  signature: string;
};

/** Handles the births coming from OpenCRVS */
export const birthHandler: RouteHandlerMethod = async (request, reply) => {
  const {
    id: eventId,
    trackingId,
    token,
    data,
  } = request.body as OpenCRVSBirthEvent;

  const decryptedData = decryptData(data, CREDENTIAL_PARTNER_PRIVATE_KEY);

  sendNid({ eventId, trackingId, token }).catch((e) => {
    console.error(e);
  });

  return reply.status(202).send();
};
