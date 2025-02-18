import { RouteHandlerMethod } from "fastify";
import { sendEmail } from "../mailer";
import identities from "../mock-identities.json" assert { type: "json" };

export const deactivateNidHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  const { nid } = request.body as {
    nid: string;
  };

  if (identities.some((identity) => identity.nid === nid)) {
    console.log(`${JSON.stringify({ nid }, null, 4)}, deactivating NID...`);
    sendEmail(`NID deactivated for ${nid}`, `NID deactivated: ${nid}`);

    return reply.status(200).send();
  }

  const notFound = Math.random() > 0.5;

  // Fake validation logic for if "NID is not found" or "NID is already deactivated"
  if (notFound) {
    sendEmail(`NID not found for ${nid}`, `NID not found: ${nid}`);
    return reply.status(404).send();
  } else {
    sendEmail(
      `NID already deactivated for ${nid}`,
      `NID conflict, already deactivated: ${nid}`,
    );
    return reply.status(409).send();
  }
};
