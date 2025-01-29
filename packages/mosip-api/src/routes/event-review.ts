import { FastifyRequest, FastifyReply } from "fastify";
import { getComposition, getInformantType } from "../types/fhir";
import { updateField } from "../opencrvs-api";

type OpenCRVSRequest = FastifyRequest<{
  Body: fhir3.Bundle;
}>;

export const reviewEventHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply,
) => {
  const informantType = getInformantType(request.body);
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

  // Initial test of the verification, we will verify only other informants than mother and father
  if (informantType !== "mother" && informantType !== "father") {
    await updateField(
      eventId,
      `birth.informant.informant-view-group.verified`,
      'verified',
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  return reply.code(200).send({ success: true });
};
