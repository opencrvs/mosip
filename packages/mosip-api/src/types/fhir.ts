// Copypasted types from @opencrvs/commons
// For this reason, here are shortcuts and `!` assertions, as we haven't copypasted ALL types from @opencrvs/commons

import { format } from "date-fns/format";

declare const __nominal__type: unique symbol;
export type Nominal<Type, Identifier extends string> = Type & {
  readonly [__nominal__type]: Identifier;
};

export type FhirResourceType =
  | fhir3.FhirResource["resourceType"]
  | "TaskHistory"
  | "CompositionHistory";

export type UUID = Nominal<string, "UUID">;

// Patient/${UUID}
export type ResourceIdentifier<
  Resource extends { resourceType: FhirResourceType } = {
    resourceType: FhirResourceType;
  },
> = `${Resource["resourceType"]}/${UUID}`;

export type Address = Omit<fhir3.Address, "type" | "extension"> & {
  type?: fhir3.Address["type"] | "SECONDARY_ADDRESS" | "PRIMARY_ADDRESS";
  extension?: Array<
    KnownExtensionType["http://opencrvs.org/specs/extension/part-of"]
  >;
};

export type WithStrictExtensions<T extends Resource> = Omit<T, "extension"> & {
  extension?: Array<Extension>;
};

export type Location = WithStrictExtensions<
  Omit<fhir3.Location, "address" | "partOf"> & {
    address?: Address;
    partOf?: {
      reference: ResourceIdentifier;
    };
  }
>;

export type StringExtensionType = {
  "http://opencrvs.org/specs/extension/makeCorrection": {
    url: "http://opencrvs.org/specs/extension/makeCorrection";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/markedAsDuplicate": {
    url: "http://opencrvs.org/specs/extension/markedAsDuplicate";
    valueString?: string;
  };
  "http://opencrvs.org/specs/extension/educational-attainment": {
    url: "http://opencrvs.org/specs/extension/educational-attainment";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/age": {
    url: "http://opencrvs.org/specs/extension/age";
    /**
     * @deprecated The field should not be used!
     * valueString seems to be either a string or a number
     */
    valueString?: string | number;
    valueInteger?: number;
  };
  "http://opencrvs.org/specs/extension/patient-occupation": {
    url: "http://opencrvs.org/specs/extension/patient-occupation";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/reason-not-applying": {
    url: "http://opencrvs.org/specs/extension/reason-not-applying";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/contact-person": {
    url: "http://opencrvs.org/specs/extension/contact-person";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/contact-relationship": {
    url: "http://opencrvs.org/specs/extension/contact-relationship";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/contact-person-phone-number": {
    url: "http://opencrvs.org/specs/extension/contact-person-phone-number";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/contact-person-email": {
    url: "http://opencrvs.org/specs/extension/contact-person-email";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/informants-signature": {
    url: "http://opencrvs.org/specs/extension/informants-signature";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/groom-signature": {
    url: "http://opencrvs.org/specs/extension/groom-signature";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/bride-signature": {
    url: "http://opencrvs.org/specs/extension/bride-signature";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/witness-one-signature": {
    url: "http://opencrvs.org/specs/extension/witness-one-signature";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/witness-two-signature": {
    url: "http://opencrvs.org/specs/extension/witness-two-signature";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/requestingIndividual": {
    url: "http://opencrvs.org/specs/extension/requestingIndividual";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/regVerified": {
    url: "http://opencrvs.org/specs/extension/regVerified";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/regDownloaded": {
    url: "http://opencrvs.org/specs/extension/regDownloaded";
    valueString?: string;
  };
  "http://opencrvs.org/specs/extension/requestingIndividualOther": {
    url: "http://opencrvs.org/specs/extension/requestingIndividualOther";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/flaggedAsPotentialDuplicate": {
    url: "http://opencrvs.org/specs/extension/flaggedAsPotentialDuplicate";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/duplicateTrackingId": {
    url: "http://opencrvs.org/specs/extension/duplicateTrackingId";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/in-complete-fields": {
    url: "http://opencrvs.org/specs/extension/in-complete-fields";
    valueString: string;
  };
  "http://opencrvs.org/specs/id/statistics-male-populations": {
    url: "http://opencrvs.org/specs/id/statistics-male-populations";
    valueString: string;
  };
  "http://opencrvs.org/specs/id/statistics-female-populations": {
    url: "http://opencrvs.org/specs/id/statistics-female-populations";
    valueString: string;
  };
  "http://opencrvs.org/specs/id/statistics-total-populations": {
    url: "http://opencrvs.org/specs/id/statistics-total-populations";
    valueString: string;
  };
  "http://opencrvs.org/specs/id/statistics-crude-birth-rates": {
    url: "http://opencrvs.org/specs/id/statistics-crude-birth-rates";
    valueString: string;
  };
  "http://opencrvs.org/specs/extension/hasShowedVerifiedDocument": {
    url: "http://opencrvs.org/specs/extension/hasShowedVerifiedDocument";
    /**
     * @deprecated The field should not be used!
     */
    valueString?: string;
    valueBoolean: boolean;
  };
  "http://opencrvs.org/specs/extension/regLastOffice": {
    url: "http://opencrvs.org/specs/extension/regLastOffice";
    valueReference: { reference: ResourceIdentifier<Location> };
  };
};

export type KnownExtensionType = StringExtensionType & {
  "http://opencrvs.org/specs/extension/regLastUser": {
    url: "http://opencrvs.org/specs/extension/regLastUser";
    valueReference: {
      reference: ResourceIdentifier;
    };
  };
  "http://opencrvs.org/specs/extension/collector": {
    url: "http://opencrvs.org/specs/extension/collector";
    valueReference: {
      reference: ResourceIdentifier;
    };
  };
  "http://opencrvs.org/specs/extension/relatedperson-affidavittype": {
    url: "http://opencrvs.org/specs/extension/relatedperson-affidavittype";
    valueAttachment: {
      contentType: string;
      data: string;
    };
  };
  "http://opencrvs.org/specs/extension/payment": {
    url: "http://opencrvs.org/specs/extension/payment";
    valueReference: {
      reference: ResourceIdentifier;
    };
  };
  "http://opencrvs.org/specs/extension/date-of-marriage": {
    url: "http://opencrvs.org/specs/extension/date-of-marriage";
    valueDateTime: string;
  };
  "http://opencrvs.org/specs/extension/paymentDetails": {
    url: "http://opencrvs.org/specs/extension/paymentDetails";
    valueReference: {
      reference: string;
    };
  };
  "http://hl7.org/fhir/StructureDefinition/location-boundary-geojson": {
    url: "http://hl7.org/fhir/StructureDefinition/location-boundary-geojson";
    valueAttachment: {
      contentType: string;
      data: string;
    };
  };
  "http://opencrvs.org/specs/extension/timeLoggedMS": {
    url: "http://opencrvs.org/specs/extension/timeLoggedMS";
    valueInteger: number;
  };
  "http://opencrvs.org/specs/extension/age-of-individual-in-years": {
    url: "http://opencrvs.org/specs/extension/age-of-individual-in-years";
    valueInteger: number;
  };
  "http://opencrvs.org/specs/extension/noSupportingDocumentationRequired": {
    url: "http://opencrvs.org/specs/extension/noSupportingDocumentationRequired";
    valueBoolean: boolean;
  };
  "http://opencrvs.org/specs/extension/employee-signature": {
    url: "http://opencrvs.org/specs/extension/employee-signature";
    valueSignature: {
      contentType: string;
      when?: string;
      type?: Array<{ system: string; code: string; display: string }>;
      blob: string;
    };
  };
  "http://opencrvs.org/specs/extension/regAssigned": {
    url: "http://opencrvs.org/specs/extension/regAssigned";
  };
  "http://opencrvs.org/specs/extension/regReinstated": {
    url: "http://opencrvs.org/specs/extension/regReinstated";
  };
  "http://opencrvs.org/specs/extension/regViewed": {
    url: "http://opencrvs.org/specs/extension/regViewed";
  };
  "http://opencrvs.org/specs/extension/markedAsNotDuplicate": {
    url: "http://opencrvs.org/specs/extension/markedAsNotDuplicate";
  };
  "http://opencrvs.org/specs/extension/regUnassigned": {
    url: "http://opencrvs.org/specs/extension/regUnassigned";
  };
  "http://opencrvs.org/specs/extension/part-of": {
    url: "http://opencrvs.org/specs/extension/part-of";
    valueReference: {
      reference: ResourceIdentifier<Location>;
    };
  };
  "http://hl7.org/fhir/StructureDefinition/patient-nationality": {
    url: "http://hl7.org/fhir/StructureDefinition/patient-nationality";
    extension: Array<
      | {
          url: "code";
          valueCodeableConcept: {
            coding: [{ system: string; code: string }];
          };
        }
      | {
          url: "period";
          valuePeriod: {
            start: string;
            end: string;
          };
        }
    >;
  };
};
export type Extension = KnownExtensionType[keyof KnownExtensionType];

export type TrackingID = Nominal<string, "TrackingID">;
export type RegistrationNumber = Nominal<string, "RegistrationNumber">;

export type TaskIdentifier =
  | {
      system: "http://opencrvs.org/specs/id/mosip-aid";
      value: string;
    }
  | {
      system: "http://opencrvs.org/specs/id/draft-id";
      value: string;
    }
  | {
      system: "http://opencrvs.org/specs/id/birth-tracking-id";
      value: TrackingID;
    }
  | {
      system: "http://opencrvs.org/specs/id/death-tracking-id";
      value: TrackingID;
    }
  | {
      system: "http://opencrvs.org/specs/id/marriage-tracking-id";
      value: TrackingID;
    }
  | {
      system: "http://opencrvs.org/specs/id/birth-registration-number";
      value: RegistrationNumber;
    }
  | {
      system: "http://opencrvs.org/specs/id/death-registration-number";
      value: RegistrationNumber;
    }
  | {
      system: "http://opencrvs.org/specs/id/marriage-registration-number";
      value: RegistrationNumber;
    }
  | {
      system: "http://opencrvs.org/specs/id/system_identifier";
      value: string;
    }
  | {
      system: "http://opencrvs.org/specs/id/paper-form-id";
      value: string;
    }
  | {
      system: "http://opencrvs.org/specs/id/dhis2_event_identifier";
      value: string;
    };
export type TaskStatus =
  | "IN_PROGRESS"
  | "ARCHIVED"
  | "DECLARED"
  | "DECLARATION_UPDATED"
  | "WAITING_VALIDATION"
  | "CORRECTION_REQUESTED"
  | "VALIDATED"
  | "REGISTERED"
  | "CERTIFIED"
  | "REJECTED"
  | "ISSUED";
export type Resource = fhir3.Resource;
export type Task = Omit<
  fhir3.Task,
  | "lastModified"
  | "status"
  | "extension"
  | "businessStatus"
  | "intent"
  | "identifier"
  | "code"
> & {
  lastModified: string;
  status: "ready" | "requested" | "draft" | "accepted" | "rejected";
  extension: Array<Extension>;
  businessStatus: Omit<fhir3.CodeableConcept, "coding"> & {
    coding: Array<
      Omit<fhir3.Coding, "code" | "system"> & {
        system: "http://opencrvs.org/specs/reg-status";
        code: TaskStatus;
      }
    >;
  };
  intent?: fhir3.Task["intent"];
  identifier: Array<TaskIdentifier>;
  code: Omit<fhir3.CodeableConcept, "coding"> & {
    coding: Array<
      Omit<fhir3.Coding, "code" | "system"> & {
        system: "http://opencrvs.org/specs/types";
        code: "BIRTH" | "DEATH" | "MARRIAGE";
      }
    >;
  };
  // This field is missing from the fhir3 spec
  // @todo Where exactly it's used?
  encounter?: fhir3.Reference;
};

export type SavedTask = Omit<Task, "focus" | "id"> & {
  id: UUID;
  focus: {
    reference: ResourceIdentifier;
  };
};

export function isTask<T extends Resource>(
  resource: T,
): resource is (T & Task) | (T & SavedTask) {
  return resource.resourceType === "Task";
}

export function getTaskFromSavedBundle<T extends fhir3.Bundle>(bundle: T) {
  const task = bundle.entry!.map(({ resource }) => resource!).find(isTask);

  if (!task) {
    throw new Error("No task found in bundle");
  }

  return task as SavedTask;
}

export function getTrackingId(record: fhir3.Bundle) {
  const task = getTaskFromSavedBundle(record);

  const identifier = task.identifier.find((identifier) =>
    identifier.system.endsWith("tracking-id"),
  );

  if (!identifier) {
    throw new Error("No tracking id found from task");
  }

  return identifier.value as TrackingID;
}

export function isComposition<T extends Resource>(
  resource: T,
): resource is T & fhir3.Composition & { id: UUID } {
  return resource.resourceType === "Composition";
}

export function getComposition<T extends fhir3.Bundle>(bundle: T) {
  const composition = bundle
    .entry!.map(({ resource }) => resource!)
    .find(isComposition);

  if (!composition) {
    throw new Error("Composition not found in bundle");
  }

  return composition;
}

export enum EVENT_TYPE {
  BIRTH = "BIRTH",
  DEATH = "DEATH",
  MARRIAGE = "MARRIAGE",
}

const DETECT_EVENT: Record<string, EVENT_TYPE> = {
  "birth-notification": EVENT_TYPE.BIRTH,
  "birth-declaration": EVENT_TYPE.BIRTH,
  "death-notification": EVENT_TYPE.DEATH,
  "death-declaration": EVENT_TYPE.DEATH,
  "marriage-notification": EVENT_TYPE.MARRIAGE,
  "marriage-declaration": EVENT_TYPE.MARRIAGE,
};

export function getTaskEventType(task: Task) {
  const eventType = task?.code?.coding?.[0].code;
  return eventType;
}

function getCompositionEventType(composition: fhir3.Composition) {
  const eventType = composition?.type?.coding?.[0].code;
  return eventType && DETECT_EVENT[eventType];
}

export function getEventType(fhirBundle: fhir3.Bundle) {
  if (fhirBundle.entry && fhirBundle.entry[0] && fhirBundle.entry[0].resource) {
    const firstEntry = fhirBundle.entry[0].resource;
    if (firstEntry.resourceType === "Composition") {
      return getCompositionEventType(
        firstEntry as fhir3.Composition,
      ) as EVENT_TYPE;
    } else {
      return getTaskEventType(firstEntry as Task) as EVENT_TYPE;
    }
  }

  throw new Error("Invalid FHIR bundle found");
}

export function getPatientNationalId(patient: fhir3.Patient) {
  const identifier = patient.identifier?.find(
    (identifier) => identifier.type?.coding?.[0].code === "NATIONAL_ID",
  );
  if (!identifier?.value) {
    throw new Error("National ID not found in patient");
  }
  return identifier.value;
}

export function getFromBundleById(bundle: fhir3.Bundle, id: string) {
  const resource = bundle.entry?.find((item) => item.resource?.id === id);

  if (!resource) {
    throw new Error("Resource not found in bundle with id " + id);
  }

  if (!resource.fullUrl) {
    throw new Error(
      "A resource was found but it did not have a fullUrl. This should not happen.",
    );
  }

  return resource;
}

function findDeceasedEntry(
  composition: fhir3.Composition,
  bundle: fhir3.Bundle,
) {
  const patientSection = composition.section?.find((section) =>
    section.code?.coding?.some((coding) => coding.code === "deceased-details"),
  );
  if (!patientSection || !patientSection.entry) {
    throw new Error("Deceased details not found in composition");
  }
  const reference = patientSection.entry[0].reference;
  return getFromBundleById(bundle, reference!.split("/")[1]).resource;
}

export const getDeceasedNid = (bundle: fhir3.Bundle) => {
  const composition = getComposition(bundle);
  const deceased = findDeceasedEntry(composition, bundle);
  return getPatientNationalId(deceased as fhir3.Patient);
};

export function findCompositionSection<T extends fhir3.Composition>(
  code: string,
  composition: T,
) {
  return composition.section!.find((section) =>
    section.code!.coding!.some((coding) => coding.code === code),
  );
}

export function resourceIdentifierToUUID(
  resourceIdentifier: ResourceIdentifier,
) {
  const urlParts = resourceIdentifier.split("/");
  return urlParts[urlParts.length - 1] as UUID;
}

export type URNReference = `urn:uuid:${UUID}`;

export function isURNReference(id: string): id is URNReference {
  return id.startsWith("urn:uuid:");
}

export function isSaved<T extends Resource>(resource: T) {
  return resource.id !== undefined;
}

export function findEntryFromBundle(
  bundle: fhir3.Bundle,
  reference: fhir3.Reference["reference"],
) {
  return isURNReference(reference!)
    ? bundle.entry!.find((entry) => entry.fullUrl === reference)
    : bundle.entry!.find(
        (entry) =>
          isSaved(entry.resource!) &&
          entry.resource!.id ===
            resourceIdentifierToUUID(reference as ResourceIdentifier),
      );
}

export function getInformantType(record: fhir3.Bundle) {
  const compositionSection = findCompositionSection(
    "informant-details",
    getComposition(record),
  );
  if (!compositionSection) return undefined;
  const personSectionEntry = compositionSection.entry![0];
  const personEntry = findEntryFromBundle(record, personSectionEntry.reference);

  return (personEntry?.resource as fhir3.RelatedPerson).relationship
    ?.coding?.[0].code;
}

function getInformantPatient(record: fhir3.Bundle) {
  const compositionSection = findCompositionSection(
    "informant-details",
    getComposition(record),
  );
  if (!compositionSection) return undefined;
  const personSectionEntry = compositionSection.entry![0];
  const relatedPersonEntry = findEntryFromBundle(
    record,
    personSectionEntry.reference,
  );
  const reference = (relatedPersonEntry?.resource as fhir3.RelatedPerson)
    .patient.reference;
  return getFromBundleById(record, reference!.split("/")[1]).resource;
}

export function getInformantNationalId(record: fhir3.Bundle) {
  const informantPatient = getInformantPatient(record);
  return getPatientNationalId(informantPatient as fhir3.Patient);
}

export function findEntry<T extends fhir3.FhirResource>(
  code: string,
  composition: fhir3.Composition,
  bundle: fhir3.Bundle,
) {
  const patientSection = findCompositionSection(code, composition);
  if (!patientSection || !patientSection.entry) {
    return undefined;
  }
  const reference = patientSection.entry[0].reference;
  return getFromBundleById(bundle, reference!.split("/")[1]).resource as T;
}

function transformFhirNameIntoIdentityInfo(name: fhir3.HumanName) {
  return {
    value: [name.given?.join(" ").trim(), name.family].join(" ").trim(),
    language: name.use!,
  };
}

export function getDemographics(patient: fhir3.Patient): {
  name: { language: string; value: string }[] | undefined;
  gender: { language: string; value: string }[] | undefined;
  dob: string | undefined;
} {
  const name = patient.name
    ? patient.name.map(transformFhirNameIntoIdentityInfo)
    : undefined;
  const gender = patient.gender
    ? /* @TODO: Depending on the country configuration, the language would need to be changed. Further implementation testing is needed with MOSIP!  */
      [{ value: patient.gender, language: "eng" }]
    : undefined;
  const dob = patient.birthDate
    ? format(new Date(patient.birthDate), "yyyy/MM/dd")
    : undefined;
  return {
    name,
    gender,
    dob,
  };
}
