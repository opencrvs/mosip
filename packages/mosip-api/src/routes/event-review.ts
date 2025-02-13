import { FastifyRequest, FastifyReply } from "fastify";
import {
  EVENT_TYPE,
  findEntry,
  getComposition,
  getEventType,
  getInformantNationalId,
  getInformantType,
  getPatientNationalId,
} from "../types/fhir";
import { updateField } from "../opencrvs-api";
import { verifyNid } from "../mosip-api";
import { logger } from "../logger";

type OpenCRVSRequest = FastifyRequest<{
  Body: fhir3.Bundle;
}>;

const verifyAndUpdateRecord = async ({
  event,
  eventId,
  nid,
  section,
  token,
}: {
  event: "birth" | "death";
  eventId: string;
  nid: string;
  section: string;
  token: string;
}) => {
  const {
    response: { authStatus },
  } = await verifyNid({
    nid,
    // @TODO: Figure out the actual DOB
    dob: "1992/04/29",
  });

  if (authStatus) {
    logger.info(
      { eventId },
      `Person verified. ✅ Updating '${event}.${section}.${section}-view-group.verified'...`,
    );

    await updateField(
      eventId,
      `${event}.${section}.${section}-view-group.verified`,
      "verified",
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } else {
    logger.info(
      { eventId },
      `Person verification failed. ❌ Updating '${event}.${section}.${section}-view-group.verified'...`,
    );

    await updateField(
      eventId,
      `${event}.${section}.${section}-view-group.verified`,
      "failed",
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }
  return authStatus;
};

export const reviewEventHandler = async (
  request: OpenCRVSRequest,
  reply: FastifyReply,
) => {
  const informantType = getInformantType(request.body);
  const informantNationalID = getInformantNationalId(request.body);

  const composition = getComposition(request.body);
  const { id: eventId } = composition;

  if (!request.headers.authorization) {
    return reply.code(401).send({ error: "Authorization header is missing" });
  }

  const token = request.headers.authorization.split(" ")[1];
  if (!token) {
    return reply
      .code(401)
      .send({ error: "Token is missing in Authorization header" });
  }

  logger.info(
    { eventId },
    "Received a review event, calling IDA Auth SDK for the persons in record...",
  );

  const verificationStatus = {
    father: false,
    mother: false,
    informant: false,
  };

  // @NOTE: Marriage not supported yet
  // @NOTE: The following code is very verbose, but rather not abstract if not needed. For events v2 we'll have to rework this.
  // @TODO: Should we batch the requests?
  const event =
    getEventType(request.body) === EVENT_TYPE.BIRTH ? "birth" : "death";

  /*
   * Update informant's details if it's not MOTHER or FATHER
   */
  if (informantType !== "MOTHER" && informantType !== "FATHER") {
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "informant",
      nid: informantNationalID,
      token,
    });
    verificationStatus.informant = result;
  }

  /*
   * Update mother's and fathers details if the NID is available
   */
  const mother = findEntry(
    "mother-details",
    composition,
    request.body,
  ) as fhir3.Patient;
  const father = findEntry(
    "father-details",
    composition,
    request.body,
  ) as fhir3.Patient;

  let motherNid;

  try {
    motherNid = getPatientNationalId(mother);
  } catch (e) {
    logger.info(
      { eventId },
      "Couldn't find the mother's NID. This is non-fatal - it likely wasn't submitted.",
    );
  }

  if (motherNid) {
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "mother",
      nid: motherNid,
      token,
    });
    verificationStatus.mother = result;
  }

  let fatherNid;

  try {
    fatherNid = getPatientNationalId(father);
  } catch (e) {
    logger.info(
      { eventId },
      "Couldn't find the fathers NID. This is non-fatal - it likely wasn't submitted.",
    );
  }

  if (fatherNid) {
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "father",
      nid: fatherNid,
      token,
    });
    verificationStatus.father = result;
  }

  return reply.code(202).send(verificationStatus);
};
