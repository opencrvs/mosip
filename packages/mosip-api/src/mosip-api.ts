import { env } from "./constants";
import MOSIPAuthenticator from "@mosip/ida-auth-sdk";

export class MOSIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MOSIPError";
  }
}

export const postBirthRecord = async ({
  event,
  token,
}: {
  event: {
    id: string;
    trackingId: string;
  };
  token: string;
}) => {
  const response = await fetch(env.MOSIP_BIRTH_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({ event, token }),
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

  return response.json() as Promise<{
    aid: string;
  }>;
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
