import type * as Hapi from "@hapi/hapi";

/**
 * Checks if the request payload is verified by the identity system.
 *
 * @param request - The Hapi request object containing the payload to be verified.
 * @returns A boolean indicating whether the payload is verified.
 */
export function isVerified(request: Hapi.Request) {
  const payload = request.payload as fhir3.Bundle;
  const questionnaireResponse = payload.entry?.find(
    (e): e is fhir3.BundleEntry<fhir3.QuestionnaireResponse> =>
      e.resource?.resourceType === "QuestionnaireResponse",
  )?.resource;
  const verifiedQuestions = questionnaireResponse?.item?.filter((i) =>
    [
      "birth.informant.informant-view-group.verified",
      "birth.mother.mother-view-group.verified",
      "birth.father.father-view-group.verified",
    ].includes(i.text!),
  );
  return verifiedQuestions && verifiedQuestions.length > 0
    ? !verifiedQuestions.some((q) => q.answer?.[0]?.valueString === "failed")
    : true;
}
