import { FastifyRequest, FastifyReply } from "fastify";
import {
  EVENT_TYPE,
  findEntry,
  getComposition,
  getEventType,
  getInformantType,
  getDemographics,
  getPatientNationalId,
} from "../types/fhir";
import { updateField } from "../opencrvs-api";
import { verifyNid } from "../mosip-api";
import { logger } from "../logger";
import { format } from "date-fns/format";

type OpenCRVSRequest = FastifyRequest<{
  Body: fhir3.Bundle;
}>;

const verifyAndUpdateRecord = async ({
  event,
  eventId,
  nid,
  name,
  dob,
  gender,
  section,
  token,
}: {
  event: "birth" | "death";
  eventId: string;
  nid: string;
  dob: string | undefined;
  name: { value: string; language: string }[] | undefined;
  gender: { value: string; language: string }[] | undefined;
  section: string;
  token: string;
}) => {
  const {
    response: { authStatus },
  } = await verifyNid({
    nid,
    dob,
    name,
    gender,
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
  if (!request.headers.authorization) {
    return reply.code(401).send({ error: "Authorization header is missing" });
  }

  const token = request.headers.authorization.split(" ")[1];
  if (!token) {
    return reply
      .code(401)
      .send({ error: "Token is missing in Authorization header" });
  }

  const informantType = getInformantType(request.body);
  const composition = getComposition(request.body);
  const { id: eventId } = composition;

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
    let informant = findEntry(
      "informant-details",
      composition,
      request.body,
    ) as fhir3.Patient;
    let informantNID;
    const informantDemographics = getDemographics(informant);

    try {
      informantNID = getPatientNationalId(informant);
    } catch (e) {
      logger.info(
        { eventId },
        "Couldn't find the informant's NID. This is non-fatal - it likely wasn't submitted.",
      );
    }

    if (informantNID) {
      const result = await verifyAndUpdateRecord({
        eventId,
        event,
        section: "informant",
        nid: informantNID,
        name: informantDemographics.name,
        dob: informantDemographics.dob,
        gender: informantDemographics.gender,
        token,
      });
      verificationStatus.informant = result;
    }
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
  const motherDemographics = getDemographics(mother);

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
      name: motherDemographics.name,
      dob: motherDemographics.dob,
      gender: motherDemographics.gender,
      token,
    });
    verificationStatus.mother = result;
  }

  let fatherNid;
  const fatherDemographics = getDemographics(father);

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
      name: fatherDemographics.name,
      dob: fatherDemographics.dob,
      gender: fatherDemographics.gender,
      token,
    });
    verificationStatus.father = result;
  }

  return reply.code(202).send(verificationStatus);
};
