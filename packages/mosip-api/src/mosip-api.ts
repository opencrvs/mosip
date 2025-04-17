import { env } from "./constants";
import MOSIPAuthenticator from "@mosip/ida-auth-sdk";
import { OpenCRVSRequest } from "./routes/event-registration";
import { schemaJson } from "./types/idSchemaJson";

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
  request,
}: {
  event: {
    id: string;
    trackingId: string;
  };
  request: OpenCRVSRequest;
}) => {
  const { requestFields, audit, notification } = request.body;
  const requestBody = JSON.stringify(
    {
      id: "string",
      version: "string",
      requesttime: new Date().toISOString(),
      request: {
        id: event.id,
        refId: "10002_10003",
        offlineMode: false,
        process: "CRVS_NEW",
        source: "OPENCRVS",
        schemaVersion: "0.100",
        fields: requestFields,
        metaInfo: {
          metaData:
            '[{\n  "label" : "registrationType",\n  "value" : "CRVS_NEW"\n}, {\n  "label" : "machineId",\n  "value" : "10003"\n}, {\n  "label" : "centerId",\n  "value" : "10002"\n}]',
          registrationId: "652042703244",
          operationsData:
            '[{\n  "label" : "officerId",\n  "value" : "sithara.bevolv"\n}, {\n  "label" : "officerPIN",\n  "value" : null\n}, {\n  "label" : "officerPassword",\n  "value" : "true"\n}, {\n  "label" : "officerBiometricFileName",\n  "value" : null\n}, {\n  "label" : "supervisorId",\n  "value" : null\n}, {\n  "label" : "supervisorPIN",\n  "value" : null\n}, {\n  "label" : "supervisorBiometricFileName",\n  "value" : null\n}, {\n  "label" : "supervisorPassword",\n  "value" : null\n}, {\n  "label" : "supervisorOTPAuthentication",\n  "value" : null\n}, {\n  "label" : "officerOTPAuthentication",\n  "value" : null\n}]',
          capturedRegisteredDevices: "[]",
          creationDate: "202503121345",
        },
        audits: Array.of(audit),
        schemaJson: schemaJson,
      },
    },
    null,
    2,
  );

  const authToken = await getMosipAuthToken();

  // packet manager: create packet
  const createPacketResponse = await fetch(env.MOSIP_CREATE_PACKET_URL, {
    method: "PUT",
    body: requestBody,
    headers: {
      "Content-Type": "application/json",
      Cookie: `Authorization=${authToken};`,
    },
  });

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
        source: "OPENCRVS",
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

  const processPacketResponse = await fetch(env.MOSIP_PROCESS_PACKET_URL, {
    method: "POST",
    body: processPacketRequestBody,
    headers: {
      "Content-Type": "application/json",
      Cookie: `Authorization=${authToken};`,
    },
  });

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

export const deactivateNid = async ({
  event,
  request,
}: {
  event: {
    id: string;
    trackingId: string;
  };
  request: OpenCRVSRequest;
}) => {
  const authToken = await getMosipAuthToken();
  const { requestFields, audit, notification } = request.body;

  const deactivatePacketRequestBody = JSON.stringify({
    id: "string",
    version: "string",
    requesttime: new Date().toISOString(),
    request: {
      id: event.id,
      refId: "10018_10084",
      offlineMode: false,
      process: "CRVS_DEATH",
      source: "OPENCRVS",
      schemaVersion: "0.300",
      fields: requestFields,
      metaInfo: {
        metaData:
          '[{\n  "label" : "registrationType",\n  "value" : "CRVS_DEATH"\n}, {\n  "label" : "machineId",\n  "value" : "10084"\n}, {\n  "label" : "centerId",\n  "value" : "10018"\n}]',
        registrationId: "65204270321266",
        operationsData:
          '[{\n  "label" : "officerId",\n  "value" : "nambi"\n}, {\n  "label" : "officerPIN",\n  "value" : null\n}, {\n  "label" : "officerPassword",\n  "value" : "true"\n}, {\n  "label" : "officerBiometricFileName",\n  "value" : null\n}, {\n  "label" : "supervisorId",\n  "value" : null\n}, {\n  "label" : "supervisorPIN",\n  "value" : null\n}, {\n  "label" : "supervisorBiometricFileName",\n  "value" : null\n}, {\n  "label" : "supervisorPassword",\n  "value" : null\n}, {\n  "label" : "supervisorOTPAuthentication",\n  "value" : null\n}, {\n  "label" : "officerOTPAuthentication",\n  "value" : null\n}]',
        capturedRegisteredDevices: "[]",
        creationDate: "20250225110733",
      },
      audits: Array.of(audit),
      schemaJson: schemaJson,
    },
  });

  // packet manager: deactivate packet
  const deactivatePacketResponse = await fetch(env.MOSIP_CREATE_PACKET_URL, {
    method: "PUT",
    body: deactivatePacketRequestBody,
    headers: {
      "Content-Type": "application/json",
      Cookie: `Authorization=${authToken};`,
    },
  });

  if (!deactivatePacketResponse.ok) {
    throw new Error(
      `Failed sending record to MOSIP, response: ${await deactivatePacketResponse.text()}`,
    );
  }

  const responseJson = await deactivatePacketResponse.json();

  // packet manager: process packet API.
  const processPacketRequestBody = JSON.stringify(
    {
      id: "mosip.registration.processor.workflow.instance",
      requesttime: new Date().toISOString(),
      version: "v1",
      request: {
        registrationId: event.id,
        process: "CRVS_DEATH",
        source: "OPENCRVS",
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

  const processPacketResponse = await fetch(env.MOSIP_PROCESS_PACKET_URL, {
    method: "POST",
    body: processPacketRequestBody,
    headers: {
      "Content-Type": "application/json",
      Cookie: `Authorization=${authToken};`,
    },
  });

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
  // return processPacketResponse;
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
