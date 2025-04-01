import { env } from "./constants";
import MOSIPAuthenticator from "@mosip/ida-auth-sdk";

export class MOSIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MOSIPError";
  }
}

export async function getMosipAuthToken() {
  const response = await fetch(env.MOSIP_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: "string",
      version: "string",
      requesttime: new Date().toISOString(),
      metadata: {},
      request: {
        clientId: env.MOSIP_AUTH_CLIENT_ID,
        secretKey: env.MOSIP_AUTH_CLIENT_SECRET,
        appId: env.MOSIP_AUTH_CLIENT_APP_ID,
      },
    }),
  });

  if (!response.ok) {
    throw new MOSIPError(
      `Failed getting MOSIP auth token. Response: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }

  // Get the 'Set-Cookie' header from the response
  const cookie: string | null = response.headers.get("Set-Cookie");

  if (!cookie || cookie === null) {
    throw new MOSIPError(
      `Failed getting MOSIP auth token. Response: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }

  // Split the string by ';' to separate the cookie parts
  const cookieParts = cookie.split(";");

  // The first part will be the Authorization token
  const authorizationPart = cookieParts[0];

  // Extract the token by splitting on '='
  const token = authorizationPart.split("=")[1];
  return token;
}

export const postBirthRecord = async ({
  id,
  registrationNumber,
}: {
  id: string;
  registrationNumber: string;
}) => {
  const response = await fetch(env.MOSIP_BIRTH_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({
      request: {
        process: "CRVS_NEW",
        id,
        fields: { birthCertificateNumber: registrationNumber },
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new MOSIPError(
      `Failed to post record to MOSIP. Status: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }

  return response.text();
};

export const deactivateNid = async ({ nid }: { nid: string }) => {
  const response = await fetch(env.MOSIP_DEATH_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({ nid }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
};

export const verifyNid = async ({
  nid,
  name,
  gender,
  dob,
}: {
  nid: string;
  /** date of birth as YYYY/MM/DD */
  dob: string | undefined;
  name: { language: string; value: string }[] | undefined;
  gender: { language: string; value: string }[] | undefined;
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
      name,
      gender,
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
