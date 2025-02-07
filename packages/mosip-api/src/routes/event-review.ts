import { FastifyRequest, FastifyReply } from "fastify";
import {
  getComposition,
  getInformantNationalId,
  getInformantType,
} from "../types/fhir";
import { updateField } from "../opencrvs-api";
import { verifyNid } from "../mosip-api";

type OpenCRVSRequest = FastifyRequest<{
  Body: fhir3.Bundle;
}>;

export const reviewEventHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply,
) => {
  const informantNationalID = getInformantNationalId(request.body);
  const { id: eventId } = getComposition(request.body);

  if (!request.headers.authorization) {
    return reply.code(401).send({ error: "Authorization header is missing" });
  }

  const token = request.headers.authorization.split(" ")[1];
  if (!token) {
    return reply
      .code(401)
      .send({ error: "Token is missing in Authorization header" });
  }

  const {
    response: { authStatus },
  } = await verifyNid({
    nid: informantNationalID,
    // @TODO: Figure out the actual DOB
    dob: "1992/04/29",
  });

  if (authStatus) {
    await updateField(
      eventId,
      `birth.informant.informant-view-group.verified`,
      "verified",
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } else {
    await updateField(
      eventId,
      `birth.informant.informant-view-group.verified`,
      "failed",
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  return reply.code(200).send({ success: true });
};
