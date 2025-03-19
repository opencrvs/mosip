import { env } from "./constants";
import MOSIPAuthenticator from "@mosip/ida-auth-sdk";
import { OpenCRVSRequest } from "./routes/event-registration";
import {
  EVENT_TYPE,
  findEntry,
  getComposition,
  getEventType,
  getInformantPatient,
  getQuestionnaireResponseAnswer,
} from "./types/fhir";

export class MOSIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MOSIPError";
  }
}

export async function getMosipAuthToken() {
  console.log(
    "env.MOSIP_AUTH_URL: ",
    env.MOSIP_AUTH_URL,
    env.MOSIP_AUTH_CLIENT_ID,
    env.MOSIP_AUTH_CLIENT_SECRET,
  );
  const response = await fetch(env.MOSIP_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // cookie: `Authorization=${authToken}; OpenCRVSToken=${token};`,
    },
    body: `
    {
      "id": "string",
      "version": "string",
      "requesttime": "2025-03-11T02:53:07.206Z",
      "metadata": {},
        "request": {
            "clientId": "${env.MOSIP_AUTH_CLIENT_ID}",
            "secretKey": "${env.MOSIP_AUTH_CLIENT_SECRET}",
            "appId": "admin"
        }
    }
    `,
  });

  if (!response.ok) {
    throw new MOSIPError(
      `Failed getting MOSIP auth token. Response: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }
  const responseJson = await response.json();
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
    if (guardianDetails.identifier?.[0].value) {
      return {
        identifier: guardianDetails.identifier?.[0].value,
        type: guardianDetails.identifier?.[0].type?.coding?.[0].code,
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
      request,
      "birth.child.child-view-group.nonTongan",
    ) === true
      ? "NON-TONGAN"
      : "TONGAN";

  const requestFields = {
    fullName: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"${childName?.given?.join(" ")} ${childName?.family}\"\n} ]`,
    dateOfBirth: child.birthDate,
    gender: `[ {\n  "language" : "eng",\n  "value" :       "${child.gender}"\n}]`,
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
    residentStatus: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"${residentStatus}\"\n} ]`,

    vid: "JA8023B498309V", // cannot pass from crvs mdediator side (UID & VID created at the same time)
    email: "", // Task --> contact-person-email
    phone: "", // Task --> contact-person-phone-number
    guardianOrParentBirthCertificateNumber: "M89234BYAS0238", // from QuestionnaireResponse
    birthCertificateNumber: "C83B023548BST", // BRN
    addressLine1: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Kandy\"\n}]`,
    addressLine2: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Badulla\"\n}]`,
    addressLine3: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Badulla\"\n}]`,
    district: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Vava’u\"\n} ]`,
    village: `[ {\n  \"language\" : \"eng\",\n  \"value\" : \"Talihau \"\n} ]`,
    birthRegistrationCertificate: "base-64 document string",
    passportId: "base-64 document string",
    nationalId: "base-64 document string",
    drivingLicenseId: "base-64 document string",
    addressProof: "base-64 document string",
  };

  const requestBody = JSON.stringify(
    {
      id: composition.id,
      version: "string",
      requesttime: new Date().toISOString(),
      request: {
        id: composition.id,
        refId: "10002_10003",
        offlineMode: false,
        process: "CRVS_NEW",
        source: "OPENCRVS",
        schemaVersion: "0.100",
        fields: requestFields,
        metaInfo: {
          metaData:
            '[{\n  "label" : "registrationType",\n  "value" : "CRVS_NEW"\n}, {\n  "label" : "machineId",\n  "value" : "10003"\n}, {\n  "label" : "centerId",\n  "value" : "10002"\n}]',
          registrationId: "789456125",
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
            id: composition.id,
            idType: "REGISTRATION_ID",
            createdBy: "suraj m",
            moduleName: "Packet Handler",
            moduleId: "REG-MOD-117",
            description: "Packet Succesfully Created",
            actionTimeStamp: new Date().toISOString(),
          },
        ],
        schemaJson:
          '{\n\t"$schema": "http://json-schema.org/draft-07/schema#",\n\t"description": "Tonga digital identity for ID Hub",\n\t"additionalProperties": false,\n\t"title": "Tonga identity",\n\t"type": "object",\n\t"definitions": {\n\t\t"simpleType": {\n\t\t\t"uniqueItems": true,\n\t\t\t"additionalItems": false,\n\t\t\t"type": "array",\n\t\t\t"items": {\n\t\t\t\t"additionalProperties": false,\n\t\t\t\t"type": "object",\n\t\t\t\t"required": [\n\t\t\t\t\t"language",\n\t\t\t\t\t"value"\n\t\t\t\t],\n\t\t\t\t"properties": {\n\t\t\t\t\t"language": {\n\t\t\t\t\t\t"type": "string"\n\t\t\t\t\t},\n\t\t\t\t\t"value": {\n\t\t\t\t\t\t"type": "string"\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t},\n\t\t"documentType": {\n\t\t\t"additionalProperties": false,\n\t\t\t"type": "object",\n\t\t\t"properties": {\n\t\t\t\t"format": {\n\t\t\t\t\t"type": "string"\n\t\t\t\t},\n\t\t\t\t"type": {\n\t\t\t\t\t"type": "string"\n\t\t\t\t},\n\t\t\t\t"value": {\n\t\t\t\t\t"type": "string"\n\t\t\t\t},\n\t\t\t\t"refNumber": {\n\t\t\t\t\t"type": [\n\t\t\t\t\t\t"string",\n\t\t\t\t\t\t"null"\n\t\t\t\t\t]\n\t\t\t\t}\n\t\t\t}\n\t\t},\n\t\t"biometricsType": {\n\t\t\t"additionalProperties": false,\n\t\t\t"type": "object",\n\t\t\t"properties": {\n\t\t\t\t"format": {\n\t\t\t\t\t"type": "string"\n\t\t\t\t},\n\t\t\t\t"version": {\n\t\t\t\t\t"type": "number",\n\t\t\t\t\t"minimum": 0\n\t\t\t\t},\n\t\t\t\t"value": {\n\t\t\t\t\t"type": "string"\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t},\n\t"properties": {\n\t\t"identity": {\n\t\t\t"additionalProperties": false,\n\t\t\t"type": "object",\n\t\t\t"required": [\n\t\t\t\t"IDSchemaVersion",\n\t\t\t\t"fullName",\n\t\t\t\t"dateOfBirth",\n\t\t\t\t"gender",\n\t\t\t\t"addressLine1"\n\t\t\t],\n\t\t\t"properties": {\n\t\t\t\t"proofOfAddress": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"gender": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"sex": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"city": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{0,50}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"postalCode": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^[(?i)A-Z0-9]{5}$|^NA$",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"proofOfException-1": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "evidence",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"referenceIdentityNumber": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^([0-9]{10,30})$",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "kyc",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"individualBiometrics": {\n\t\t\t\t\t"bioAttributes": [\n\t\t\t\t\t\t"leftEye",\n\t\t\t\t\t\t"rightEye",\n\t\t\t\t\t\t"rightIndex",\n\t\t\t\t\t\t"rightLittle",\n\t\t\t\t\t\t"rightRing",\n\t\t\t\t\t\t"rightMiddle",\n\t\t\t\t\t\t"leftIndex",\n\t\t\t\t\t\t"leftLittle",\n\t\t\t\t\t\t"leftRing",\n\t\t\t\t\t\t"leftMiddle",\n\t\t\t\t\t\t"leftThumb",\n\t\t\t\t\t\t"rightThumb",\n\t\t\t\t\t\t"face"\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/biometricsType"\n\t\t\t\t},\n\t\t\t\t"province": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{0,50}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"zone": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"proofOfDateOfBirth": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"addressLine1": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{0,50}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"addressLine2": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{3,50}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"residenceStatus": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "kyc",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"addressLine3": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{3,50}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"district": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{1,100}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"village": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{1,100}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"email": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^[A-Za-z0-9_\\\\-]+(\\\\.[A-Za-z0-9_]+)*@[A-Za-z0-9_-]+(\\\\.[A-Za-z0-9_]+)*(\\\\.[a-zA-Z]{2,})$",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"introducerRID": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "evidence",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"introducerBiometrics": {\n\t\t\t\t\t"bioAttributes": [\n\t\t\t\t\t\t"leftEye",\n\t\t\t\t\t\t"rightEye",\n\t\t\t\t\t\t"rightIndex",\n\t\t\t\t\t\t"rightLittle",\n\t\t\t\t\t\t"rightRing",\n\t\t\t\t\t\t"rightMiddle",\n\t\t\t\t\t\t"leftIndex",\n\t\t\t\t\t\t"leftLittle",\n\t\t\t\t\t\t"leftRing",\n\t\t\t\t\t\t"leftMiddle",\n\t\t\t\t\t\t"leftThumb",\n\t\t\t\t\t\t"rightThumb",\n\t\t\t\t\t\t"face"\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/biometricsType"\n\t\t\t\t},\n\t\t\t\t"fullName": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{3,50}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"dateOfBirth": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(1869|18[7-9][0-9]|19[0-9][0-9]|20[0-9][0-9])/([0][1-9]|1[0-2])/([0][1-9]|[1-2][0-9]|3[01])$",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"individualAuthBiometrics": {\n\t\t\t\t\t"bioAttributes": [\n\t\t\t\t\t\t"leftEye",\n\t\t\t\t\t\t"rightEye",\n\t\t\t\t\t\t"rightIndex",\n\t\t\t\t\t\t"rightLittle",\n\t\t\t\t\t\t"rightRing",\n\t\t\t\t\t\t"rightMiddle",\n\t\t\t\t\t\t"leftIndex",\n\t\t\t\t\t\t"leftLittle",\n\t\t\t\t\t\t"leftRing",\n\t\t\t\t\t\t"leftMiddle",\n\t\t\t\t\t\t"leftThumb",\n\t\t\t\t\t\t"rightThumb",\n\t\t\t\t\t\t"face"\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/biometricsType"\n\t\t\t\t},\n\t\t\t\t"introducerUIN": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "evidence",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"proofOfIdentity": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"IDSchemaVersion": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "none",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "number",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"minimum": 0\n\t\t\t\t},\n\t\t\t\t"proofOfException": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "evidence",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"phone": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^[+]*([0-9]{1})([0-9]{9})$",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"guardianOrParentName": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{1,100}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"guardianOrParentBirthCertificateNumber": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"handle": true\n\t\t\t\t},\n\t\t\t\t"residentStatus": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"introducerName": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "evidence",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"proofOfRelationship": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"UIN": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "none",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"vid": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "none",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "default"\n\t\t\t\t},\n\t\t\t\t"birthCertificateNumber": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"handle": true\n\t\t\t\t},\n\t\t\t\t"passportNumber": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"handle": true\n\t\t\t\t},\n\t\t\t\t"nationalIdNumber": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"handle": true\n\t\t\t\t},\n\t\t\t\t"drivingLicenseNumber": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"handle": true\n\t\t\t\t},\n\t\t\t\t"birthRegistrationCertificate": {\n\t\t\t\t  "bioAttributes": [],\n\t\t\t\t  "fieldCategory": "evidence",\n\t\t\t\t  "format": "none",\n\t\t\t\t  "fieldType": "default",\n\t\t\t\t  "$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"passportId": {\n\t\t\t\t  "bioAttributes": [],\n\t\t\t\t  "fieldCategory": "evidence",\n\t\t\t\t  "format": "none",\n\t\t\t\t  "fieldType": "default",\n\t\t\t\t  "$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"nationalId": {\n\t\t\t\t  "bioAttributes": [],\n\t\t\t\t  "fieldCategory": "evidence",\n\t\t\t\t  "format": "none",\n\t\t\t\t  "fieldType": "default",\n\t\t\t\t  "$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"drivingLicenseId": {\n\t\t\t\t  "bioAttributes": [],\n\t\t\t\t  "fieldCategory": "evidence",\n\t\t\t\t  "format": "none",\n\t\t\t\t  "fieldType": "default",\n\t\t\t\t  "$ref": "#/definitions/documentType"\n\t\t\t\t},\n\t\t\t\t"deceasedStatus": {\n\t\t\t\t  "bioAttributes": [],\n\t\t\t\t  "fieldCategory": "kyc",\n\t\t\t\t  "format": "none",\n\t\t\t\t  "fieldType": "default",\n\t\t\t\t  "type": "boolean"\n\t\t\t\t},\n\t\t\t\t"preferredLang": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"type": "string",\n\t\t\t\t\t"fieldType": "dynamic"\n\t\t\t\t},\n\t\t\t\t"region": {\n\t\t\t\t\t"bioAttributes": [],\n\t\t\t\t\t"validators": [\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t"validator": "^(?=.{0,50}$).*",\n\t\t\t\t\t\t\t"arguments": [],\n\t\t\t\t\t\t\t"type": "regex"\n\t\t\t\t\t\t}\n\t\t\t\t\t],\n\t\t\t\t\t"fieldCategory": "pvt",\n\t\t\t\t\t"format": "none",\n\t\t\t\t\t"fieldType": "default",\n\t\t\t\t\t"$ref": "#/definitions/simpleType"\n\t\t\t\t},\n\t\t\t\t"selectedHandles": {\n\t\t\t\t  "fieldCategory": "none",\n\t\t\t\t  "format": "none",\n\t\t\t\t  "type": "array",\n\t\t\t\t  "items": { "type": "string" },\n\t\t\t\t  "fieldType": "default"\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n}',
      },
    },
    null,
    2,
  );

  const authToken = await getMosipAuthToken();

  // packet manager: create packet
  const response = await fetch(env.MOSIP_PACKET_MANAGER_URL, {
    method: "PUT",
    body: requestBody,
    headers: {
      "Content-Type": "application/json",
      Cookie: `Authorization=${authToken};`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed sending record to MOSIP, response: ${await response.text()}`,
    );
  }

  const responseJson = await response.json();
  console.log("responseJson: ", responseJson);

  // packet manager: process packet API.

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
