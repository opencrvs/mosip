import { RouteHandlerMethod } from "fastify";
import { createNid } from "../random-identifiers";
import { sendEmail } from "../mailer";
import { DECRYPT_IDA_AUTH_PRIVATE_KEY, env } from "../constants";
import { encryptMosipCredential } from "../websub/crypto";

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

  const response = await fetch(env.MOSIP_WEBSUB_CALLBACK_URL, {
    method: "POST",
    body: JSON.stringify({
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
            {
              issuedTo: "patner-opencrvs-i1",
              protectedAttributes: [],
              issuanceDate: timestamp,
              credentialSubject: {
                id,
                birthCertificateNumber,
                VID: nid,
              },
              id: "http://mosip.io/credentials/04f7a758-b7c7-4f7e-9d97-546204dfc6bb",
              type: ["MOSIPVerifiableCredential"],
              consent: "",
              issuer: "https://mosip.io/issuers/",
            },
            DECRYPT_IDA_AUTH_PRIVATE_KEY,
          ),
          proof: {
            signature: "abcdefg", // @TODO: Abdul is working on this
          },
          credentialType: "euin",
          protectionKey: "275700",
        },
      },
    }),
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
