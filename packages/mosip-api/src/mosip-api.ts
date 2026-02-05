import { env } from "./constants";
import MOSIPAuthenticator from "@mosip/ida-auth-sdk";
import { schemaJson } from "./types/idSchemaJson";
import {
  BirthRequestFields,
  DeathRequestFields,
  MosipInteropPayload,
} from "@opencrvs/mosip/api";

export class MOSIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MOSIPError";
  }
}

const logFetch = async (
  url: string,
  options: RequestInit,
  response: Response,
) => {
  const requestHeaders = options.headers ?? {};
  const requestBody =
    typeof options.body === "string"
      ? options.body
      : options.body
        ? "[non-string body]"
        : "";
  const responseText = await response.clone().text();
  const responseHeaders: Record<string, string> = {};

  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  console.log("MOSIP fetch request", {
    url,
    method: options.method ?? "GET",
    headers: requestHeaders,
    body: requestBody,
  });

  console.log("MOSIP fetch response", {
    url,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body: responseText,
  });
};

const fetchWithLogging = async (url: string, options: RequestInit) => {
  const response = await fetch(url, options);
  await logFetch(url, options, response);
  return response;
};

const logAuthenticatorResponse = async (response: Response) => {
  const responseText = await response.clone().text();
  const responseHeaders: Record<string, string> = {};

  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  console.log("MOSIP authenticator response", {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body: responseText,
  });
};

export type AuthType = "PACKET" | "WEBSUB";

export async function getMosipAuthToken(authType: AuthType) {
  const response = await fetchWithLogging(env.MOSIP_AUTH_URL, {
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
        clientId:
          authType === "PACKET"
            ? env.MOSIP_PACKET_AUTH_CLIENT_ID
            : env.MOSIP_WEBSUB_AUTH_CLIENT_ID,
        secretKey:
          authType === "PACKET"
            ? env.MOSIP_PACKET_AUTH_CLIENT_SECRET
            : env.MOSIP_WEBSUB_AUTH_CLIENT_SECRET,
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

  if (!cookie) {
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
  event,
  requestFields,
  audit,
  metaInfo,
  notification,
}: {
  event: {
    id: string;
    trackingId: string;
  };
  requestFields: BirthRequestFields;
  audit: MosipInteropPayload["audit"];
  metaInfo: MosipInteropPayload["metaInfo"];
  notification: MosipInteropPayload["notification"];
}) => {
  const requestBody = JSON.stringify(
    {
      id: "string",
      version: "string",
      requesttime: new Date().toISOString(),
      request: {
        id: event.id,
        refId: `${env.MOSIP_CENTER_ID}_${env.MOSIP_MACHINE_ID}`,
        offlineMode: false,
        process: "CRVS_NEW",
        source: "CRVS1",
        schemaVersion: "0.500",
        fields: requestFields,
        metaInfo: metaInfo,
        audits: Array.of(audit),
        schemaJson: schemaJson,
      },
    },
    null,
    2,
  );

  const authToken = await getMosipAuthToken("PACKET");

  // packet manager: create packet
  const createPacketResponse = await fetchWithLogging(
    env.MOSIP_CREATE_PACKET_URL,
    {
      method: "PUT",
      body: requestBody,
      headers: {
        "Content-Type": "application/json",
        Cookie: `Authorization=${authToken};`,
      },
    },
  );

  if (!createPacketResponse.ok) {
    throw new Error(
      `Failed sending record to MOSIP, response: ${await createPacketResponse.text()}`,
    );
  }

  await createPacketResponse.json();

  // packet manager: process packet API.
  const processPacketRequestBody = JSON.stringify(
    {
      id: "mosip.registration.processor.workflow.instance",
      requesttime: new Date().toISOString(),
      version: "v1",
      request: {
        registrationId: event.id,
        process: "CRVS_NEW",
        source: "CRVS1",
        additionalInfoReqId: "",
        notificationInfo: {
          name: notification.recipientFullName,
          phone: notification.recipientPhone || "",
          email: notification.recipientEmail || "",
        },
      },
    },
    null,
    2,
  );

  const processPacketResponse = await fetchWithLogging(
    env.MOSIP_PROCESS_PACKET_URL,
    {
      method: "POST",
      body: processPacketRequestBody,
      headers: {
        "Content-Type": "application/json",
        Cookie: `Authorization=${authToken};`,
      },
    },
  );

  if (!processPacketResponse.ok) {
    throw new Error(
      `Failed sending record to MOSIP, response: ${await processPacketResponse.text()}`,
    );
  }

  const processPacketResponseJson = await processPacketResponse.json();

  if (processPacketResponseJson?.errors?.length > 0) {
    throw new Error(
      `Error in processing packet, response: ${await processPacketResponseJson?.errors[0]?.message}`,
    );
  }
};

export const postDeathRecord = async ({
  event,
  requestFields,
  audit,
  metaInfo,
  notification,
}: {
  event: {
    id: string;
    trackingId: string;
  };
  requestFields: DeathRequestFields;
  audit: MosipInteropPayload["audit"];
  metaInfo: MosipInteropPayload["metaInfo"];
  notification: MosipInteropPayload["notification"];
}) => {
  const authToken = await getMosipAuthToken("PACKET");

  const { deathCertificateNumber, ...newRequestBody } = requestFields;

  const deactivatePacketRequestBody = JSON.stringify(
    {
      id: "string",
      version: "string",
      requesttime: new Date().toISOString(),
      request: {
        id: event.id,
        refId: `${env.MOSIP_CENTER_ID}_${env.MOSIP_MACHINE_ID}`,
        offlineMode: false,
        process: "CRVS_DEATH",
        source: "CRVS1",
        schemaVersion: "0.100",
        fields: newRequestBody,
        metaInfo: metaInfo,
        audits: Array.of(audit),
        schemaJson: schemaJson,
      },
    },
    null,
    2,
  );

  // packet manager: deactivate packet
  const deactivatePacketResponse = await fetchWithLogging(
    env.MOSIP_CREATE_PACKET_URL,
    {
      method: "PUT",
      body: deactivatePacketRequestBody,
      headers: {
        "Content-Type": "application/json",
        Cookie: `Authorization=${authToken};`,
      },
    },
  );

  if (!deactivatePacketResponse.ok) {
    throw new Error(
      `Failed sending record to MOSIP, response: ${await deactivatePacketResponse.text()}`,
    );
  }

  await deactivatePacketResponse.json();

  // packet manager: process packet API.
  const processPacketRequestBody = JSON.stringify(
    {
      id: "mosip.registration.processor.workflow.instance",
      requesttime: new Date().toISOString(),
      version: "v1",
      request: {
        registrationId: event.id,
        process: "CRVS_DEATH",
        source: "CRVS1",
        additionalInfoReqId: "",
        notificationInfo: {
          name: notification.recipientFullName,
          phone: notification.recipientPhone || "",
          email: notification.recipientEmail || "",
        },
      },
    },
    null,
    2,
  );

  const processPacketResponse = await fetchWithLogging(
    env.MOSIP_PROCESS_PACKET_URL,
    {
      method: "POST",
      body: processPacketRequestBody,
      headers: {
        "Content-Type": "application/json",
        Cookie: `Authorization=${authToken};`,
      },
    },
  );

  if (!processPacketResponse.ok) {
    throw new Error(
      `Failed sending record to MOSIP, response: ${await processPacketResponse.text()}`,
    );
  }

  const processPacketResponseJson = await processPacketResponse.json();

  if (processPacketResponseJson?.errors?.length > 0) {
    throw new Error(
      `Error in processing packet, response: ${await processPacketResponseJson?.errors[0]?.message}`,
    );
  }
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

  await logAuthenticatorResponse(response);

  if (!response.ok) {
    throw new Error(`Error in MOSIP Authenticator: ${await response.text()}`);
  }

  const responseJson = (await response.json()) as {
    responseTime: string;
    response: { authStatus: boolean; authToken: string };
  };

  console.log("MOSIP Authenticator response", responseJson);

  return responseJson;
};
