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
    deceased: false,
    spouse: false,
  };

  // @NOTE: Marriage not supported yet
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
   * Update mother's details if the NID is available
   */
  const mother = findEntry(
    "mother-details",
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

  /*
   * Update father's details if the NID is available
   */
  const father = findEntry(
    "father-details",
    composition,
    request.body,
  ) as fhir3.Patient;

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

  /*
   * Update deceased's details if the NID is available
   */
  let deceasedNid;
  const deceasedDemographics = getDemographics(father);

  const deceased = findEntry(
    "deceased-details",
    composition,
    request.body,
  ) as fhir3.Patient;

  try {
    deceasedNid = getPatientNationalId(deceased);
  } catch (e) {
    logger.info(
      { eventId },
      "Couldn't find the deceased's NID. This is non-fatal - it likely wasn't submitted.",
    );
  }

  if (deceasedNid) {
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "deceased",
      nid: deceasedNid,
      name: deceasedDemographics.name,
      dob: deceasedDemographics.dob,
      gender: deceasedDemographics.gender,
      token,
    });
    verificationStatus.deceased = result;
  }

  /*
   * Update spouses's details if the NID is available
   */
  let spouseNid;
  const spouseDemographics = getDemographics(father);

  const spouse = findEntry(
    "spouse-details",
    composition,
    request.body,
  ) as fhir3.Patient;

  try {
    spouseNid = getPatientNationalId(spouse);
  } catch (e) {
    logger.info(
      { eventId },
      "Couldn't find the spouse's NID. This is non-fatal - it likely wasn't submitted.",
    );
  }

  if (spouseNid) {
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "spouse",
      nid: spouseNid,
      name: spouseDemographics.name,
      dob: spouseDemographics.dob,
      gender: spouseDemographics.gender,
      token,
    });
    verificationStatus.spouse = result;
  }

  return reply.code(202).send(verificationStatus);
};
