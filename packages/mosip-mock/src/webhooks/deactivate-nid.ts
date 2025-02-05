import { RouteHandlerMethod } from "fastify";
import { sendEmail } from "../mailer";
import { alreadyDeactivatedNids, notFoundNids } from "../mock-nids";

export const deactivateNidHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  const { nid } = request.body as {
    nid: string;
  };

  // Fake validation logic for if "NID is not found" or "NID is already deactivated"
  if (notFoundNids.includes(nid)) {
    sendEmail(`NID not found for ${nid}`, `NID not found: ${nid}`);
    return reply.status(404).send();
  }

  if (alreadyDeactivatedNids.includes(nid)) {
    sendEmail(
      `NID already deactivated for ${nid}`,
      `NID conflict, already deactivated: ${nid}`,
    );
    return reply.status(409).send();
  }

  console.log(`${JSON.stringify({ nid }, null, 4)}, deactivating NID...`);

  sendEmail(`NID deactivated for ${nid}`, `NID deactivated: ${nid}`);

  return reply.status(200).send();
};
