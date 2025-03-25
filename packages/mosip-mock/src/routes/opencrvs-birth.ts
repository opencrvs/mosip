import { RouteHandlerMethod } from "fastify";
import { createAid, createNid } from "../random-identifiers";
import { sendEmail } from "../mailer";
import { env } from "../constants";

const sendNid = async ({
  transactionId,
  refId,
}: {
  transactionId: string;
  refId: string;
}) => {
  console.log(
    `${JSON.stringify({ transactionId, refId }, null, 4)}, creating NID...`,
  );

  const nid = await createNid();
  console.log(
    `${JSON.stringify({ transactionId, refId }, null, 4)}, ..."${nid}" created.`,
  );

  await sendEmail(
    `NID created for transaction ID ${transactionId}`,
    `NID: ${nid}`,
  );

  const response = await fetch(env.OPENCRVS_MOSIP_API_URL, {
    method: "POST",
    body: JSON.stringify({ request: { id: transactionId, refId }, nid }),
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
    id: string;
    refId: string;
    process: "CRVS_NEW";
  };
};

/** Handles the births coming from OpenCRVS */
export const opencrvsBirthHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  const {
    request: { id: transactionId, refId },
  } = request.body as CrvsNewRequest;

  sendNid({ transactionId, refId }).catch((e) => {
    console.error(e);
  });

  return reply.status(202).send({
    aid: createAid(),
  });
};
