import { RouteHandlerMethod } from "fastify";
import { createAid, createNid } from "../random-identifiers";
import { sendEmail } from "../mailer";
import { env } from "../constants";

const sendNid = async ({
  token,
  eventId,
  trackingId,
}: {
  token: string;
  eventId: string;
  trackingId: string;
}) => {
  console.log(
    `${JSON.stringify({ eventId, trackingId }, null, 4)}, creating NID...`,
  );

  const nid = await createNid();
  console.log(
    `${JSON.stringify({ eventId, trackingId }, null, 4)}, ..."${nid}" created.`,
  );

  await sendEmail(`NID created for tracking ID ${trackingId}`, `NID: ${nid}`);

  const response = await fetch(env.OPENCRVS_MOSIP_API_URL, {
    method: "POST",
    body: JSON.stringify({ nid, token, eventId, trackingId }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
    id: string;
    refId: string;
    process: "CRVS_NEW";
  };
};

/** Handles the births coming from OpenCRVS */
export const packetManagerCreateHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  const {
    request: { id, refId },
  } = request.body as CrvsNewRequest;

  // @TODO: Amend when we know how the WebSub responds

  // sendNid({ token, eventId: event.id, trackingId: event.trackingId }).catch(
  //   (e) => {
  //     console.error(e);
  //   },
  // );

  return reply.status(202).send({
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
        refId,
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
        refId,
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
        refId,
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

/** Handles the births coming from OpenCRVS */
export const packetManagerProcessHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  const {
    request: { id, refId },
  } = request.body as CrvsNewRequest;

  // @TODO: Amend when we know how the WebSub responds

  // sendNid({ token, eventId: event.id, trackingId: event.trackingId }).catch(
  //   (e) => {
  //     console.error(e);
  //   },
  // );

  return reply.status(200).send({
    id: "mosip.registration.processor.workflow.instance",
    version: "v1",
    responsetime: new Date().toISOString(),
    response: {
      workflowInstanceId: "dd9f218b-279c-4d93-8cda-9857976293ea",
    },
    errors: null,
  });
};
