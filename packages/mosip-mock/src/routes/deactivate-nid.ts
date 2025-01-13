import { RouteHandlerMethod } from "fastify";
import { sendEmail } from "../mailer";

export const deactivateNidHandler: RouteHandlerMethod = async (
  request,
  reply
) => {
  const { nid } = request.body as {
    nid: string;
  };

  // Fake validation logic for if "NID is not found" or "NID is already deactivated"
  const notFoundNids = [
    "0000000000",
    "1111111111",
    "2222222222",
    "3333333333",
    "4444444444",
  ];
  if (notFoundNids.includes(nid)) {
    sendEmail(`NID not found for ${nid}`, `NID not found: ${nid}`);
    return reply.status(404).send();
  }

  const alreadyDeactivatedNids = [
    "5555555555",
    "6666666666",
    "7777777777",
    "8888888888",
    "9999999999",
  ];
  if (alreadyDeactivatedNids.includes(nid)) {
    sendEmail(
      `NID already deactivated for ${nid}`,
      `NID conflict, already deactivated: ${nid}`
    );
    return reply.status(409).send();
  }

  console.log(`${JSON.stringify({ nid }, null, 4)}, deactivating NID...`);

  sendEmail(`NID deactivated for ${nid}`, `NID deactivated: ${nid}`);

  return reply.status(200).send();
};
