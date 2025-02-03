import { FastifyRequest, FastifyReply } from "fastify";
import {
  getComposition,
  getInformantNationalId,
  getInformantType,
} from "../types/fhir";
import { updateField } from "../opencrvs-api";

type OpenCRVSRequest = FastifyRequest<{
  Body: fhir3.Bundle;
}>;

const stubValidNIDs = [
  "1204837295",
  "1210563847",
  "1223948576",
  "1238475062",
  "1249583720",
  "1256074839",
  "1263849205",
  "1275093846",
  "1283749502",
  "1295067384",
];
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

  // Initial test of the verification, we will verify only other informants than mother and father
  if (!stubValidNIDs.includes(informantNationalID)) {
    await updateField(
      eventId,
      `birth.informant.informant-view-group.verified`,
      'verified',
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  return reply.code(200).send({ success: true });
};
