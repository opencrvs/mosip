import { env } from "./constants";
import { encryptAndSign } from "./crypto/encrypt";
import { logger } from "./logger";

export class MOSIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MOSIPError";
  }
}

export async function getMosipAuthToken() {
  const response = await fetch(env.MOSIP_AUTH_URL, {
    method: "POST",
    body: `client_id=${env.MOSIP_AUTH_CLIENT_ID}&client_secret=${env.MOSIP_AUTH_CLIENT_SECRET}&username=${env.MOSIP_AUTH_USER}&password=${env.MOSIP_AUTH_PASS}&grant_type=password`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    throw new MOSIPError(
      `Failed getting MOSIP auth token. Response: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }

  const token = (await response.json()) as { access_token: string };
  return token["access_token"];
}

export async function generateMosipAid() {
  const authToken = await getMosipAuthToken();

  const response = await fetch(env.MOSIP_GENERATE_AID_URL, {
    method: "GET",
    headers: {
      cookie: `Authorization=${authToken}`,
    },
  });

  if (!response.ok) {
    throw new MOSIPError(
      `Failed receiving Aid. response: ${
        response.status
      }, response: ${response.text()}`,
    );
  }

  return (await response.text()) as string;
}

export const postRecord = async (
  id: string,
  trackingId: string,
  payload: fhir3.Bundle,
  token: string,
  url: string,
) => {
  const encryptionResponse = encryptAndSign(JSON.stringify(payload));
  const proxyRequest = JSON.stringify({
    id,
    trackingId,
    requestTime: new Date().toISOString(),
    data: encryptionResponse.data,
    signature: encryptionResponse.signature,
  });

  logger.info(`Encrypting payload complete. Here is payload id ${id}`);

  const authToken = await getMosipAuthToken();

  logger.info(`ID - ${id}. Received MOSIP Auth token`);

  const response = await fetch(url, {
    method: "POST",
    body: proxyRequest,
    headers: {
      "Content-Type": "application/json",
      cookie: `Authorization=${authToken}; OpenCRVSToken=${token};`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed sending record to MOSIP, response: ${await response.text()}`,
    );
  }

  logger.info(
    `ID - ${id}. Sent data to Mosip. Response: ${await response.text()}`,
  );
};
