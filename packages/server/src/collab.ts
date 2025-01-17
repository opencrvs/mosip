import { env } from "./constants";
import {
  encryptAuthData,
  getPemCertificateThumbprint,
  signAuthRequestData,
} from "./crypto/encrypt";

const IDA_AUTH_URL = `${env.IDA_AUTH_URL}/${env.PARTNER_MISP_LK}/${env.PARTNER_ID}/${env.PARTNER_APIKEY}`;

export const authenticateId = async ({
  id,
  dob,
}: {
  id: string;
  dob: string;
}) => {
  const requestData = {
    id: "mosip.identity.auth",
    version: "1.0",
    individualId: id,
    individualIdType: "VID",
    transactionID: crypto.randomUUID(),
    requestTime: new Date().toISOString(),
    specVersion: "1.0",
    thumbprint: getPemCertificateThumbprint().toString("base64"),
    domainUri: env.IDA_AUTH_DOMAIN_URI,
    env: "Staging",
    requestedAuth: {
      demo: false,
      pin: false,
      otp: false,
      bio: false,
    },
    consentObtained: true,
  };

  const authData = {
    biometrics: [],
    demographics: {
      dob: dob,
    },
  };

  const {
    encryptedAuthB64Data,
    encryptedAesKeyB64,
    encryptedAuthDataHashBase64,
  } = encryptAuthData(JSON.stringify(authData));

  const fullRequestJson = JSON.stringify({
    ...requestData,
    request: encryptedAuthB64Data,
    requestSessionKey: encryptedAesKeyB64,
    requestHMAC: encryptedAuthDataHashBase64,
  });

  const signatureHeader = await signAuthRequestData(fullRequestJson);

  const response = await fetch(IDA_AUTH_URL, {
    method: "POST",
    body: fullRequestJson,
    headers: {
      Authorization: "Authorization",
      "content-type": "application/json",
      Signature: signatureHeader,
    },
  });

  console.log("# Request");
  console.log("# URL: ", IDA_AUTH_URL);
  console.log("## Headers");
  console.log(
    JSON.stringify(
      {
        "Content-Type": "application/json",
        Signature: signatureHeader,
      },
      null,
      2
    )
  );

  console.log("## Request body");
  console.log(JSON.stringify(JSON.parse(fullRequestJson), null, 2));

  console.log("# Response");
  console.log(JSON.stringify(await response.json(), null, 2));

  return response;
};

authenticateId({ id: "4370296312658178", dob: "1992/01/01" });
