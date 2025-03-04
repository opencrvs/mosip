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
    `{"timestamp":"2025-03-04T14:08:38.949Z","id":"39779bae-b603-489a-8b32-9de06d90c22c","event":{"hub":{"topic":"BIRTH_REGISTERED"},"context":[{"resourceType":"Bundle","type":"document","entry":[{"fullUrl":"/fhir/Task/948065f3-269f-478e-8763-9854c229ea87/_history/ed477c59-37c1-4cb8-8b99-56b68a395d17","resource":{"resourceType":"Task","status":"ready","intent":"proposal","code":{"coding":[{"system":"http://opencrvs.org/specs/types","code":"BIRTH"}]},"focus":{"reference":"Composition/39779bae-b603-489a-8b32-9de06d90c22c"},"id":"948065f3-269f-478e-8763-9854c229ea87","requester":{"agent":{"reference":"Practitioner/54eec415-2214-48d3-b33c-60b10cd3bb38"}},"identifier":[{"system":"http://opencrvs.org/specs/id/draft-id","value":"1942182e-08b8-4ac8-91a7-cb2a822366d2"},{"system":"http://opencrvs.org/specs/id/birth-tracking-id","value":"BWBNOBP"}],"extension":[{"url":"http://opencrvs.org/specs/extension/contact-person-email","valueString":"pyry@opencrvs.org"},{"url":"http://opencrvs.org/specs/extension/timeLoggedMS","valueInteger":0},{"url":"http://opencrvs.org/specs/extension/regLastUser","valueReference":{"reference":"Practitioner/54eec415-2214-48d3-b33c-60b10cd3bb38"}},{"url":"http://opencrvs.org/specs/extension/regLastOffice","valueReference":{"reference":"Location/112376dd-0963-41c7-8fe5-4d799177698c"}}],"lastModified":"2025-03-04T14:08:35.566Z","businessStatus":{"coding":[{"system":"http://opencrvs.org/specs/reg-status","code":"WAITING_VALIDATION"}]},"meta":{"lastUpdated":"2025-03-04T14:08:35.566Z"}}},{"fullUrl":"/fhir/RelatedPerson/4b228002-a0d6-40f7-9457-fc31f76ab6c7/_history/243dd281-c0a4-4a84-a6f2-18a15b8cd150","resource":{"resourceType":"RelatedPerson","relationship":{"coding":[{"system":"http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype","code":"MOTHER"}]},"patient":{"reference":"Patient/29b7e2ea-2f3e-4d87-8993-84d083bec128"},"id":"4b228002-a0d6-40f7-9457-fc31f76ab6c7"}},{"resource":{"resourceType":"Patient","extension":[{"url":"http://hl7.org/fhir/StructureDefinition/patient-nationality","extension":[{"url":"code","valueCodeableConcept":{"coding":[{"system":"urn:iso:std:iso:3166","code":"FAR"}]}},{"url":"period","valuePeriod":{"start":"","end":""}}]}],"active":true,"name":[{"use":"en","given":["dgfh",""],"family":["dfgh"]}],"identifier":[{"value":"2345234512","type":{"coding":[{"system":"http://opencrvs.org/specs/identifier-type","code":"NATIONAL_ID"}]}}],"birthDate":"1990-03-03","address":[{"type":"PRIMARY_ADDRESS","line":["","","","","","","","","","","","","","","",""],"district":"de810b81-b594-4110-9b01-3ebbb066339e","state":"c09d315e-3183-4050-800d-1f759f151318","country":"FAR","extension":[{"url":"http://opencrvs.org/specs/extension/part-of","valueReference":{"reference":"Location/de810b81-b594-4110-9b01-3ebbb066339e"}}]}],"id":"29b7e2ea-2f3e-4d87-8993-84d083bec128"}},{"resource":{"resourceType":"Patient","extension":[],"active":true,"name":[{"use":"en","given":["Test",""],"family":["User"]}],"gender":"male","birthDate":"2025-01-01","id":"52eda32d-d6c0-4f3f-bfc0-181e9b29439c","identifier":[{"type":{"coding":[{"system":"http://opencrvs.org/specs/identifier-type","code":"BIRTH_REGISTRATION_NUMBER"}]},"value":"2025BWBNOBP"}]}},{"resource":{"resourceType":"Patient","extension":[{"url":"http://opencrvs.org/specs/extension/reason-not-applying","valueString":"Lol"}],"active":false,"name":[],"id":"c7e53f50-dc08-46a2-99ec-e52814e8cb16"}}],"meta":{"lastUpdated":"2025-03-04T14:08:34.967Z"}}]}}`,
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

  // @NOTE: ONLY FOR DEBUGGING PURPOSES
  // @WARNING: REMOVE THIS BEFORE DEPLOYING TO AN ACTUAL ENVIRONMENT
  console.log("pure payload", JSON.stringify(payload, null, 4));

  const response = await fetch(url, {
    method: "POST",
    body: proxyRequest,
    headers: {
      "Content-Type": "application/json",
      cookie: `Authorization=${authToken}; OpenCRVSToken=${token};`,
    },
  });

  console.log("encrypted", proxyRequest);

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
