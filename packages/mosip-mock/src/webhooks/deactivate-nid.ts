import { RouteHandlerMethod } from "fastify";
import { sendEmail } from "../mailer";

export const deactivateNidHandler: RouteHandlerMethod = async (
  request,
  reply
) => {
  const { nid } = request.body as {
    nid: string;
  };

  // Fake validation logic for QA:
  // * if the length is under 10 characters -> 404 Not Found (the NID wasn't found in the system)
  // * if the NID is over 10 characters     -> 409 Conflict  (the NID has already been deactivated)
  const nidNotFound = nid.length < 10;
  if (nidNotFound) {
    return reply.status(404).send();
  }

  const nidAlreadyDeactivated = nid.length > 10;
  if (nidAlreadyDeactivated) {
    return reply.status(409).send();
  }

  console.log(`${JSON.stringify({ nid }, null, 4)}, deactivating NID...`);

  sendEmail(`NID deactivated for ${nid}`, `NID deactivated: ${nid}`);

  return reply.status(200).send();
};
