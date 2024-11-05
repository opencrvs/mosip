// Copypasted types from @opencrvs/commons
// Later we will move to importing these from @opencrvs/toolkit

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
  }
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
  resource: T
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
    identifier.system.endsWith("tracking-id")
  );

  if (!identifier) {
    throw new Error("No tracking id found from task");
  }

  return identifier.value as TrackingID;
}

export function isComposition<T extends Resource>(
  resource: T
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