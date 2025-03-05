import { env } from "./constants";
import { encryptAndSignPacket } from "@opencrvs/java-mediator-interop";
import { logger } from "./logger";
import MOSIPAuthenticator from "@mosip/ida-auth-sdk";
import { readFileSync } from "node:fs";

export class MOSIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MOSIPError";
  }
}

export const CREDENTIAL_PARTNER_PRIVATE_KEY = readFileSync(
  env.CREDENTIAL_PARTNER_PRIVATE_KEY_PATH,
).toString();
const CREDENTIAL_PARTNER_CERTIFICATE = readFileSync(
  env.CREDENTIAL_PARTNER_CERTIFICATE_PATH,
).toString();

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
      `Failed receiving AID. response: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }

  return (await response.text()) as string;
}

export const postRecord = async (
  id: string,
  payload: unknown,
  token: string,
  url: string,
) => {
  const encryptionResponse = encryptAndSignPacket(
    JSON.stringify(payload),
    CREDENTIAL_PARTNER_PRIVATE_KEY,
    CREDENTIAL_PARTNER_CERTIFICATE,
  );
  const proxyRequest = JSON.stringify({
    id,
    requestTime: new Date().toISOString(),
    data: encryptionResponse.data,
    signature: encryptionResponse.signature,
    // NOTE! This is a new addition to the payload
    token,
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

export const verifyNid = async ({
  nid,
  dob,
}: {
  nid: string;
  /** date of birth as YYYY/MM/DD */
  dob: string;
}) => {
  const authenticator = new MOSIPAuthenticator({
    partnerApiKey: env.PARTNER_APIKEY,
    partnerMispLk: env.PARTNER_MISP_LK,
    partnerId: env.PARTNER_ID,
    idaAuthDomainUri: env.IDA_AUTH_DOMAIN_URI,
    idaAuthUrl: env.IDA_AUTH_URL,
    encryptCertPath: env.ENCRYPT_CERT_PATH,
    decryptP12FilePath: env.DECRYPT_P12_FILE_PATH,
    decryptP12FilePassword: env.DECRYPT_P12_FILE_PASSWORD,
    signP12FilePath: env.SIGN_P12_FILE_PATH,
    signP12FilePassword: env.SIGN_P12_FILE_PASSWORD,
  });

  const response = await authenticator.auth({
    individualId: nid,
    individualIdType: "UIN",
    demographicData: {
      dob,
    },
    consent: true,
  });

  if (!response.ok) {
    throw new Error(`Error in MOSIP Authenticator: ${await response.text()}`);
  }

  return (await response.json()) as {
    responseTime: string;
    response: { authStatus: boolean; authToken: string };
  };
};
