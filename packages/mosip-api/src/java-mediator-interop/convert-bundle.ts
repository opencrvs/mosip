import {
  ResourceIdentifier,
  UUID,
  findEntry,
  getComposition,
  isTask,
  resourceIdentifierToUUID,
} from "../types/fhir";

const NATIONAL_ID_BIRTH_PERMISSIONS = [
  "mother-details",
  "father-details",
  "child-details",
  "supporting-documents",
  "informant-details",
];

// The old webhook behaviour documented here if death package needs to be filtered as well

const NATIONAL_ID_DEATH_PERMISSIONS = [
  "deceased-details",
  "supporting-documents",
  "informant-details",
  "death-encounter",
];

const withLegacyPatient = (patient: fhir3.Patient) => {
  if ((patient.name ?? []).length === 0) return patient;

  return {
    ...patient,
    name: [
      {
        ...patient.name![0],
        family: [patient.name![0].family] as any as string,
      },
    ],
  } satisfies fhir3.Patient;
};

const getPermissionsBundle = (bundle: fhir3.Bundle, permissions: string[]) => {
  const composition = getComposition(bundle);
  const allowedSections = composition.section!.filter((section) =>
    section.code!.coding!.some(({ code }) => permissions.includes(code!)),
  );
  const allowedReferences = allowedSections.flatMap((section) =>
    section.entry!.map(({ reference }) =>
      resourceIdentifierToUUID(reference as ResourceIdentifier),
    ),
  );

  return {
    ...bundle,
    entry: bundle
      .entry!.filter(
        ({ resource }) =>
          allowedReferences.includes(resource!.id as UUID) || isTask(resource!),
      )
      .map((entry) => {
        if (entry.resource?.resourceType === "Patient") {
          return { resource: withLegacyPatient(entry.resource) };
        }

        return entry;
      }),
  };
};

/**
 * Converts the bundle to the Java mediator shape
 *
 * https://github.com/mosip/mosip-opencrvs/blob/4240d38bfc167768b66e94c7474f750b3592e475/samples/sampleDataFromOpencrvs1.json
 */
export const convertToLegacyBundle = (
  eventId: string,
  bundle: fhir3.Bundle,
  birthRegistrationNumber: string,
) => {
  const composition = getComposition(bundle);
  const child = findEntry(
    "child-details",
    composition,
    bundle,
  ) as fhir3.Patient;
  child.identifier ||= [];
  child.identifier.push({
    type: {
      coding: [
        {
          system: "http://opencrvs.org/specs/identifier-type",
          code: "BIRTH_REGISTRATION_NUMBER",
        },
      ],
    },
    value: birthRegistrationNumber,
  });
  const mother = findEntry("mother-details", composition, bundle);

  bundle.entry!.sort((a, b) => {
    if (a.resource!.id === child.id) return -1; // Child should come first
    if (b.resource!.id === child.id) return 1; // Child should come first
    if (a.resource!.id === mother?.id) return -1; // Mother should come second
    if (b.resource!.id === mother?.id) return 1; // Mother should come second
    return 0; // Keep the rest as is
  });

  return {
    timestamp: new Date().toISOString(),
    id: eventId,
    event: {
      hub: {
        topic: "BIRTH_REGISTERED",
      },
      context: [getPermissionsBundle(bundle, NATIONAL_ID_BIRTH_PERMISSIONS)],
    },
  };
};
