import { RouteHandlerMethod } from "fastify";
import { createNid } from "../random-identifiers";
import { sendEmail } from "../mailer";
import { PRIVATE_KEY, env } from "../constants";
import { encryptMosipCredential } from "../websub/crypto";
import crypto from "node:crypto";
import { createMockVC } from "../verifiable-credentials/issue";

const privateKey = crypto.createPrivateKey(PRIVATE_KEY);
const publicKey = crypto.createPublicKey(privateKey);

const createMosipVerifiableCredential = ({
  id,
  timestamp,
  nid,
}: {
  id: string;
  timestamp: string;
  nid: string;
}) => ({
  issuanceDate: timestamp,
  credentialSubject: {
    birthCertificateNumber: "8888888838884334",
    VID: nid,
    id: "http://credential.idrepo/credentials/" + id,
    vcVer: "VC-V1",
  },
  id: "http://credential.idrepo/credentials/" + crypto.randomUUID(),
  proof: {
    type: "RsaSignature2018",
    created: timestamp,
    proofPurpose: "assertionMethod",
    verificationMethod:
      "https://dev-api.identity.mosip.opencrvs.dev/.well-known/public-key.json",
    jws: "eyJiNjQiOmZhbHNlLCJjcml0IjpbImI2NCJdLCJraWQiOiJ2OU4zMl9wbGlpdDZmWWt4VU5rVXNQLWVhZUhiM0RzWEJWdXpiQ3VhcHhNIiwiYWxnIjoiUFMyNTYifQ..OP0taxlU5cAcX7G8zYp-z_oaofiumftk_fWxN0S2sjQtxgx4JsLr1q6yElsKbYgbnSoLAKAmigQKWCAijnipYPccFIufRgMF5Gha3Kwr99Sg0XEG3PbwWoBMa_YVHe0CSE0oALwlejRmVQNA3rpfKxlrSqy9VV1FL0OwiE6X7MdxHnbxqbR11cZd2WT71bANPuj5CqdDN-SWr5urDjKDUntYvDC_SVy2o5FPXoi4BLvvbW5Uy6M4APDNKf3d3JoPXJPJd-JlP_tv-x-bY-V8mVwIG88cdYJLh2MFgE1sUJhxeBuAAT1jHxyCSe7PReTpbBltV1vsg5HvJwq7QKkaoQ",
  },
  type: ["VerifiableCredential", "MOSIPVerifiableCredential"],
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://dev-api.identity.mosip.opencrvs.dev/.well-known/mosip-context.json",
    { sec: "https://w3id.org/security#" },
  ],
  issuer:
    "https://dev-api.identity.mosip.opencrvs.dev/.well-known/controller.json",
});

const sendNid = async ({
  id,
  birthCertificateNumber,
}: {
  id: string;
  birthCertificateNumber: string;
}) => {
  console.log(
    `${JSON.stringify({ id, birthCertificateNumber }, null, 4)}, creating NID...`,
  );

  const nid = await createNid();
  console.log(
    `${JSON.stringify({ id, birthCertificateNumber }, null, 4)}, ..."${nid}" created.`,
  );

  await sendEmail(`NID created for request id ${id}`, `NID: ${nid}`);

  const timestamp = new Date().toISOString();

  const verifiableCredential = await createMockVC({
    id,
    birthCertificateNumber,
    vid: nid,
  });

  const body = JSON.stringify({
    publisher: "CREDENTIAL_SERVICE",
    topic: env.MOSIP_WEBSUB_TOPIC,
    publishedOn: timestamp,
    event: {
      id: crypto.randomUUID(),
      transactionId: crypto.randomUUID(),
      type: {
        namespace: "mosip",
        name: "mosip",
      },
      timestamp,
      data: {
        registrationId: id,
        templateTypeCode: "RPR_UIN_CARD_TEMPLATE",
        ExpiryTimestamp: timestamp,
        TransactionLimit: null,
        credential: encryptMosipCredential(
          JSON.stringify(verifiableCredential),
          PRIVATE_KEY,
        ),
        credentialType: "vercred",
        protectionKey: "275700",
      },
    },
  });

  const response = await fetch(env.MOSIP_WEBSUB_CALLBACK_URL, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to send NID to OpenCRVS. Status: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }

  return response.text();
};

type CrvsNewRequest = {
  request: {
    process: "CRVS_NEW";
    id: string;
    fields: {
      birthCertificateNumber: string;
    };
  };
};

export const packetManagerCreateHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  const {
    request: {
      id,
      fields: { birthCertificateNumber },
    },
  } = request.body as CrvsNewRequest;

  sendNid({ id, birthCertificateNumber }).catch((e) => {
    console.error(e);
  });

  return reply.status(200).send({
    id: "mosip.registration.packet.writer",
    version: "v1",
    responsetime: new Date().toISOString(),
    metadata: null,
    response: [
      {
        id,
        packetName: "111111112_evidence",
        source: "OPENCRVS",
        process: "CRVS_NEW",
        refId: id,
        schemaVersion: "0.1",
        signature:
          "Pjss9ng-js3eZZ6eUxOjjzNtKTyAzwWNI7qun8cN2UAEIS-rV3YzionqJId1WBdNFoistFPlrqrGnfI2xaX5MY95ttMWYzw89JyAWi-VeDaYPVFWEvcLEUTU68e0uBMXFG6D15_zjiSrn9OW8pRMngUuusOaIlmGh2BwiM1NwmLbSTRHpJ0LkC69SiWQcA5igTR5ihuJtWcygiBiEX48LOaFvOkhyoShnYGlY8_gW2Ew_Z26EnJ7vP2y_ODZYqzWTRTHTDivsKQHyWdBczwGium6aug6A0H0lPSqxTXJslKylsotbA79Bv6gUviTLVjdglLdHdxIWNaVfmKeHiCQ9w",
        encryptedHash: "Cly6hXkKx6TbqwjH3Frm9DZsCPjmCnB6aVKd_8sGRm0",
        providerName: "PacketWriterImpl",
        providerVersion: "v1.0",
        creationDate: new Date().toISOString(),
      },
      {
        id,
        packetName: "111111112_optional",
        source: "OPENCRVS",
        process: "CRVS_NEW",
        refId: id,
        schemaVersion: "0.1",
        signature:
          "Pjss9ng-js3eZZ6eUxOjjzNtKTyAzwWNI7qun8cN2UAEIS-rV3YzionqJId1WBdNFoistFPlrqrGnfI2xaX5MY95ttMWYzw89JyAWi-VeDaYPVFWEvcLEUTU68e0uBMXFG6D15_zjiSrn9OW8pRMngUuusOaIlmGh2BwiM1NwmLbSTRHpJ0LkC69SiWQcA5igTR5ihuJtWcygiBiEX48LOaFvOkhyoShnYGlY8_gW2Ew_Z26EnJ7vP2y_ODZYqzWTRTHTDivsKQHyWdBczwGium6aug6A0H0lPSqxTXJslKylsotbA79Bv6gUviTLVjdglLdHdxIWNaVfmKeHiCQ9w",
        encryptedHash: "pb0yrVpnz8QwLFI2ghVXs4hPkeGivnviph7SBpjJTxU",
        providerName: "PacketWriterImpl",
        providerVersion: "v1.0",
        creationDate: new Date().toISOString(),
      },
      {
        id,
        packetName: "111111112_id",
        source: "OPENCRVS",
        process: "CRVS_NEW",
        refId: id,
        schemaVersion: "0.1",
        signature:
          "t_ShCVyVq_pro87V95AxympFG4gvnFjPHD466pgeSsRtM9KIaAH5GGOMc8jS_523wbWPCcKb-xpCPom1wYNQ5MvN_SkYitoflBC9UWRwdoZlCBAJFeaelyplFe5KmOIU28qZggoXq6fDbJXY44se72l8sGCU-hqtiz8wUFeh159D8ZN8YXs_RFnt7mmkkbro5P1nP7ZycgJwV_nbl8Z_96dvuhCnWZ06AwiSvGx4eZYkOJPcZ-1VJWA59RAsm6ez28dJV4l81Ixl1IJPzdjD_bsHe1agwOxoLqiMvMyBoCTvCy30YAtbdtmQPzKX9eohj68EZFhzT73gEi3MQMFgPA",
        encryptedHash: "fZcsf60DnFujzr_3CGfgkXy3t7Z1nQ4MRkxVvfFoslo",
        providerName: "PacketWriterImpl",
        providerVersion: "v1.0",
        creationDate: new Date().toISOString(),
      },
    ],
    errors: [],
  });
};
