import { env } from "./constants";
import MOSIPAuthenticator from "@mosip/ida-auth-sdk";
import { OpenCRVSRequest } from "./routes/event-registration";
import {
  EVENT_TYPE,
  findEntry,
  findTaskExtension,
  getComposition,
  getEventType,
  getInformantPatient,
  getQuestionnaireResponseAnswer,
  getTaskFromSavedBundle,
} from "./types/fhir";
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
  token,
  request,
}: {
  event: {
    id: string;
    trackingId: string;
  };
  token: string;
  request: OpenCRVSRequest;
}) => {
  const composition = getComposition(request.body);
  const task = getTaskFromSavedBundle(request.body);
  const emailExtension = findTaskExtension(
    task,
    "http://opencrvs.org/specs/extension/contact-person-email",
  );
  const contactNumberExtension = findTaskExtension(
    task,
    "http://opencrvs.org/specs/extension/contact-person-phone-number",
  );

  const child = findEntry(
    "child-details",
    composition,
    request.body,
  ) as fhir3.Patient;

  const childName:
    | {
        use?: string | undefined;
        given?: string[] | undefined;
        family?: string | undefined;
      }
    | undefined = child.name?.[0];

  const mother = findEntry(
    "mother-details",
    composition,
    request.body,
  ) as fhir3.Patient;

  const father = findEntry(
    "father-details",
    composition,
    request.body,
  ) as fhir3.Patient;

  const guardianDetails = mother ?? father;
  const guardianName:
    | {
        use?: string | undefined;
        given?: string[] | undefined;
        family?: string | undefined;
      }
    | undefined = guardianDetails.name?.[0];

  const informant = getInformantPatient(request.body) as fhir3.Patient;

  const returnParentID = () => {
    const motherID = mother.identifier?.[0].value;
    const fatherID = father.identifier?.[0].value;

    if (motherID) {
      return {
        identifier: motherID,
        type: mother.identifier?.[0].type?.coding?.[0].code,
      };
    } else if (fatherID) {
      return {
        identifier: fatherID,
        type: father.identifier?.[0].type?.coding?.[0].code,
      };
    } else {
      return {
        identifier: "",
        type: "NOT_FOUND",
      };
    }
  };

  const residentStatus =
    getQuestionnaireResponseAnswer(
      request.body,
      "birth.child.child-view-group.nonTongan",
    ) === true
      ? "NON-TONGAN"
      : "TONGAN";

  const requestFields = {
    fullName: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"${childName?.given?.join(" ")} ${childName?.family}\"\n} ]`,
    dateOfBirth: child.birthDate,
    gender: `[ {\n  "language" : "eng",\n  "value" :       "${child.gender}"\n}]`,
    residenceStatus: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"${residentStatus}\"\n} ]`,
    guardianOrParentName: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"${guardianName?.given?.join(" ")} ${guardianName?.family}\"\n} ]`,
    nationalIdNumber:
      returnParentID().type === "NATIONAL_ID"
        ? returnParentID().identifier
        : "",
    passportNumber:
      returnParentID().type === "PASSPORT" ? returnParentID().identifier : "",
    drivingLicenseNumber:
      returnParentID().type === "DRIVING_LICENSE"
        ? returnParentID().identifier
        : "",
    deceasedStatus:
      getEventType(request.body) === EVENT_TYPE.DEATH ? true : false,
    email: "", // Task --> contact-person-email
    phone: "", // Task --> contact-person-phone-number
    guardianOrParentBirthCertificateNumber: "M89234BYAS0238", // from QuestionnaireResponse
    birthCertificateNumber: "C83B023548BST", // BRN
    addressLine1: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Kandy\"\n}]`,
    addressLine2: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Badulla\"\n}]`,
    district: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Vava’u\"\n} ]`,
    village: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Talihau \"\n} ]`,
    birthRegistrationCertificate: "base-64 document string",
    passportId: "base-64 document string",
    nationalId: "base-64 document string",
    drivingLicenseId: "base-64 document string",
    addressProof: "base-64 document string",
  };

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
        audits: [
          {
            uuid: "c75a6315-96e9-4a3f-bcda-2432ec354336",
            createdAt: new Date().toISOString(),
            eventId: "REG-EVT-066",
            eventName: "PACKET_CREATION_SUCCESS",
            eventType: "USER",
            hostName: "desktop-q8u8jfo",
            hostIp: "localhost",
            applicationId: "REG",
            applicationName: "REGISTRATION",
            sessionUserId: "suraj",
            sessionUserName: "suraj m",
            id: "652042703244",
            idType: "REGISTRATION_ID",
            createdBy: "suraj m",
            moduleName: "Packet Handler",
            moduleId: "REG-MOD-117",
            description: "Packet Succesfully Created",
            actionTimeStamp: new Date().toISOString(),
          },
        ],
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

  const responseJson = await createPacketResponse.json();

  // packet manager: process packet API.
  const processPacketRequestBody = JSON.stringify(
    {
      id: "mosip.registration.processor.workflow.instance",
      requesttime: new Date().toISOString(),
      version: "v1",
      request: {
        registrationId: "652042703244",
        process: "CRVS_NEW",
        source: "OPENCRVS",
        additionalInfoReqId: "",
        notificationInfo: {
          name: "Sample Name", // informant details should be passed in here.
          phone: contactNumberExtension
            ? contactNumberExtension.valueString
            : "",
          email: emailExtension ? emailExtension.valueString : "",
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

  // return processPacketResponseJson.response.workflowInstanceId as Promise<{
  //   aid: string;
  // }>;
};

export const deactivateNid = async (request: OpenCRVSRequest) => {
  const authToken = await getMosipAuthToken();
  const task = getTaskFromSavedBundle(request.body);
  const emailExtension = findTaskExtension(
    task,
    "http://opencrvs.org/specs/extension/contact-person-email",
  );
  const contactNumberExtension = findTaskExtension(
    task,
    "http://opencrvs.org/specs/extension/contact-person-phone-number",
  );

  const deactivatePacketRequestBody = JSON.stringify({
    id: "string",
    version: "string",
    requesttime: new Date().toISOString(),
    request: {
      id: "65204270321266",
      refId: "10018_10084",
      offlineMode: false,
      process: "CRVS_DEATH",
      source: "OPENCRVS",
      schemaVersion: "0.300",
      fields: {
        UIN: "6520427661", // UIN to be passed from MOSIP when birth is created.
        deathDeclared: "yes",
        dateOfDeath: new Date().toISOString().slice(0, 10).replace(/-/g, "/"),
      },
      metaInfo: {
        metaData:
          '[{\n  "label" : "registrationType",\n  "value" : "CRVS_DEATH"\n}, {\n  "label" : "machineId",\n  "value" : "10084"\n}, {\n  "label" : "centerId",\n  "value" : "10018"\n}]',
        registrationId: "65204270321266",
        operationsData:
          '[{\n  "label" : "officerId",\n  "value" : "nambi"\n}, {\n  "label" : "officerPIN",\n  "value" : null\n}, {\n  "label" : "officerPassword",\n  "value" : "true"\n}, {\n  "label" : "officerBiometricFileName",\n  "value" : null\n}, {\n  "label" : "supervisorId",\n  "value" : null\n}, {\n  "label" : "supervisorPIN",\n  "value" : null\n}, {\n  "label" : "supervisorBiometricFileName",\n  "value" : null\n}, {\n  "label" : "supervisorPassword",\n  "value" : null\n}, {\n  "label" : "supervisorOTPAuthentication",\n  "value" : null\n}, {\n  "label" : "officerOTPAuthentication",\n  "value" : null\n}]',
        capturedRegisteredDevices: "[]",
        creationDate: "20250225110733",
      },
      audits: [
        {
          uuid: "c75a6315-96e9-4a3f-bcda-2432ec354336",
          createdAt: new Date().toISOString(),
          eventId: "REG-EVT-066",
          eventName: "PACKET_CREATION_SUCCESS",
          eventType: "USER",
          hostName: "desktop-62k46ah",
          hostIp: "localhost",
          applicationId: "REG",
          applicationName: "REGISTRATION",
          sessionUserId: "suraj",
          sessionUserName: "suraj m",
          id: "65204270321266",
          idType: "REGISTRATION_ID",
          createdBy: "suraj m",
          moduleName: "Packet Handler",
          moduleId: "REG-MOD-117",
          description: "Packet Succesfully Created",
          actionTimeStamp: new Date().toISOString(),
        },
      ],
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
        registrationId: "65204270321266",
        process: "CRVS_DEATH",
        source: "OPENCRVS",
        additionalInfoReqId: "",
        notificationInfo: {
          name: "John Doe", // informant details should be passed in here.
          phone: contactNumberExtension
            ? contactNumberExtension.valueString
            : "",
          email: emailExtension ? emailExtension.valueString : "",
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
