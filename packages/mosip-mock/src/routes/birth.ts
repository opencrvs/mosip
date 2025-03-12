import { RouteHandlerMethod } from "fastify";
import { createNid } from "../random-identifiers";
import { sendEmail } from "../mailer";
import { env } from "../constants";
import {
  encryptAndSignPacket,
  decryptData,
} from "@opencrvs/java-mediator-interop";
import { readFileSync } from "node:fs";
import { findEntry, getComposition } from "../types/fhir";
import { randomUUID } from "node:crypto";

export const CREDENTIAL_PARTNER_PRIVATE_KEY = readFileSync(
  env.CREDENTIAL_PARTNER_PRIVATE_KEY_PATH,
).toString();
const CREDENTIAL_PARTNER_CERTIFICATE = readFileSync(
  env.CREDENTIAL_PARTNER_CERTIFICATE_PATH,
).toString();

const sendNid = async ({
  token,
  payload,
}: {
  token: string;
  payload: { event: { context: [fhir3.Bundle] } };
}) => {
  const child = payload.event.context[0].entry![0].resource as fhir3.Patient;
  const brn = child.identifier![0].value;

  console.log(`${JSON.stringify({ brn }, null, 4)}, creating NID...`);

  const nid = await createNid();
  console.log(`${JSON.stringify({ brn }, null, 4)}, ..."${nid}" created.`);

  await sendEmail(`NID created for BRN ${brn}`, `NID: ${nid}`);

  const encryptionResponse = encryptAndSignPacket(
    JSON.stringify({
      opencrvsBRN: brn,
      uinToken: `${brn}${nid}abcdeABCDE`,
    }),
    CREDENTIAL_PARTNER_PRIVATE_KEY,
    CREDENTIAL_PARTNER_CERTIFICATE,
  );

  const proxyRequest = JSON.stringify({
    id: randomUUID(),
    requestTime: new Date().toISOString(),
    data: encryptionResponse.data,
    signature: encryptionResponse.signature,
  });

  const response = await fetch(env.OPENCRVS_MOSIP_API_URL, {
    method: "POST",
    body: proxyRequest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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
  requestTime: string;
  token: string;

  /** encrypted data */
  data: string;
  signature: string;
};

/** Handles the births coming from OpenCRVS */
export const birthHandler: RouteHandlerMethod = async (request, reply) => {
  const { token, data } = request.body as OpenCRVSBirthEvent;

  const payload = decryptData(data, CREDENTIAL_PARTNER_PRIVATE_KEY);

  sendNid({ token, payload }).catch((e) => {
    console.error(e);
  });

  return reply.status(202).send();
};
