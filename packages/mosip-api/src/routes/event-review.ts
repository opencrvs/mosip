import { FastifyRequest, FastifyReply, FastifyBaseLogger } from "fastify";
import {
  EVENT_TYPE,
  findEntry,
  getComposition,
  getEventType,
  getInformantType,
  getDemographics,
  getPatientNationalId,
  getFromBundleById,
} from "../types/fhir";
import { updateField } from "../opencrvs-api";
import { verifyNid } from "../mosip-api";

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
  logger,
}: {
  event: "birth" | "death";
  eventId: string;
  nid: string;
  dob: string | undefined;
  name: { value: string; language: string }[] | undefined;
  gender: { value: string; language: string }[] | undefined;
  section: string;
  token: string;
  logger: FastifyBaseLogger;
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
  const token = request.headers.authorization!.split(" ")[1];

  const informantType = getInformantType(request.body);
  const composition = getComposition(request.body);
  const { id: eventId } = composition;

  request.log.info(
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
   * Update informants's details if the NID is available
   */
  if (
    // As the following informant have their own separate sections, skip the verification
    informantType !== "MOTHER" &&
    informantType !== "FATHER" &&
    informantType !== "SPOUSE"
  ) {
    let relatedPerson = findEntry<fhir3.RelatedPerson>(
      "informant-details",
      composition,
      request.body,
    );

    let informantDemographics;
    let informantNID;
    try {
      const informant = getFromBundleById(
        request.body,
        relatedPerson?.patient.reference!.split("/")[1] ?? "throws-to-catch",
      ).resource as fhir3.Patient;

      informantDemographics = getDemographics(informant);
      informantNID = getPatientNationalId(informant);
    } catch (e) {
      request.log.info(
        { eventId },
        "Couldn't find the informant's NID. This is non-fatal - it likely wasn't submitted.",
      );
    }

    if (informantNID) {
      const status = await verifyAndUpdateRecord({
        eventId,
        event,
        section: "informant",
        nid: informantNID,
        name: informantDemographics!.name,
        dob: informantDemographics!.dob,
        gender: informantDemographics!.gender,
        token,
        logger: request.log,
      });

      verificationStatus.informant = status;
    }
  }

  /*
   * Update mother's details if the NID is available
   */
  const mother = findEntry<fhir3.Patient>(
    "mother-details",
    composition,
    request.body,
  );

  let motherNid;
  try {
    if (!mother) throw new Error("Mother not found in bundle");

    motherNid = getPatientNationalId(mother);
  } catch (e) {
    request.log.info(
      { eventId },
      "Couldn't find the mother's NID. This is non-fatal - it likely wasn't submitted.",
    );
  }

  if (motherNid) {
    const motherDemographics = getDemographics(mother!);
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "mother",
      nid: motherNid,
      name: motherDemographics.name,
      dob: motherDemographics.dob,
      gender: motherDemographics.gender,
      token,
      logger: request.log,
    });
    verificationStatus.mother = result;
  }

  /*
   * Update father's details if the NID is available
   */
  const father = findEntry<fhir3.Patient>(
    "father-details",
    composition,
    request.body,
  );

  let fatherNid;

  try {
    if (!father) throw new Error("Mother not found in bundle");

    fatherNid = getPatientNationalId(father);
  } catch (e) {
    request.log.info(
      { eventId },
      "Couldn't find the fathers NID. This is non-fatal - it likely wasn't submitted.",
    );
  }

  if (fatherNid) {
    const fatherDemographics = getDemographics(father!);
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "father",
      nid: fatherNid,
      name: fatherDemographics.name,
      dob: fatherDemographics.dob,
      gender: fatherDemographics.gender,
      token,
      logger: request.log,
    });
    verificationStatus.father = result;
  }

  /*
   * Update deceased's details if the NID is available
   */
  const deceased = findEntry<fhir3.Patient>(
    "deceased-details",
    composition,
    request.body,
  );

  let deceasedNid;
  try {
    if (!deceased) throw new Error("Deceased not found in bundle");

    deceasedNid = getPatientNationalId(deceased);
  } catch (e) {
    request.log.info(
      { eventId },
      "Couldn't find the deceased's NID. This is non-fatal - it likely wasn't submitted.",
    );
  }

  if (deceasedNid) {
    const deceasedDemographics = getDemographics(deceased!);
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "deceased",
      nid: deceasedNid,
      name: deceasedDemographics.name,
      dob: deceasedDemographics.dob,
      gender: deceasedDemographics.gender,
      token,
      logger: request.log,
    });
    verificationStatus.deceased = result;
  }

  /*
   * Update spouses's details if the NID is available
   */
  const spouse = findEntry<fhir3.Patient>(
    "spouse-details",
    composition,
    request.body,
  );

  let spouseNid;
  try {
    if (!spouse) throw new Error("Spouse not found in bundle");

    spouseNid = getPatientNationalId(spouse);
  } catch (e) {
    request.log.info(
      { eventId },
      "Couldn't find the spouse's NID. This is non-fatal - it likely wasn't submitted.",
    );
  }

  if (spouseNid) {
    const spouseDemographics = getDemographics(spouse!);
    const result = await verifyAndUpdateRecord({
      eventId,
      event,
      section: "spouse",
      nid: spouseNid,
      name: spouseDemographics.name,
      dob: spouseDemographics.dob,
      gender: spouseDemographics.gender,
      token,
      logger: request.log,
    });
    verificationStatus.spouse = result;
  }

  return reply.code(202).send(verificationStatus);
};
