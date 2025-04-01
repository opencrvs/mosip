import { RouteHandlerMethod } from "fastify";
import { createAid, createNid } from "../random-identifiers";
import { sendEmail } from "../mailer";
import { env } from "../constants";

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
          // @TODO: `credential` is going to be encrypted
          credential: {
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

/** Handles the births coming from OpenCRVS */
export const opencrvsBirthHandler: RouteHandlerMethod = async (
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

  return reply.status(202).send({
    aid: createAid(),
  });
};
