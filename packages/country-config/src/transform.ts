type IdentityInfo = { value: string; language: string };

export interface MOSIPPayload {
  compositionId: string;
  trackingId: string;
  notification: {
    recipientFullName: string;
    recipientEmail: string;
    recipientPhone: string;
  };
  requestFields: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    guardianOrParentName: string;
    nationalIdNumber: string;
    passportNumber: string;
    drivingLicenseNumber: string;
    deceasedStatus: boolean;
    residenceStatus: string;
    vid: string;
    email: string;
    phone: string;
    guardianOrParentBirthCertificateNumber: string;
    deathCertificateNumber: string;
    birthCertificateNumber: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    district: string;
    village: string;
    birthRegistrationCertificate: string;
    passportId: string;
    nationalId: string;
    drivingLicenseId: string;
    addressProof: string;
    selectedHandles: string;
    UIN: string;
    deathDeclared: string;
    dateOfDeath: string;
  };
  metaInfo: {
    metaData: string;
    registrationId: string;
    operationsData: string;
    capturedRegisteredDevices: string;
    creationDate: string;
  };
  audit: {
    uuid: string;
    createdAt: string;
    eventId: string;
    eventName: string;
    eventType: string;
    hostName: string;
    hostIp: string;
    applicationId: string;
    applicationName: string;
    sessionUserId: string;
    sessionUserName: string;
    id: string;
    idType: string;
    createdBy: string;
    moduleName: string;
    moduleId: string;
    description: string;
    actionTimeStamp: string;
  };
}

type Resolver<T> = (bundle: fhir3.Bundle) => T;

type ResolverMap<T> = {
  [K in keyof T]?: T[K] extends IdentityInfo[] | string | boolean | number
    ? Resolver<T[K]>
    : ResolverMap<T[K]>;
};

export function fhirBundleToMOSIPPayload(
  bundle: fhir3.Bundle,
  resolverMap: ResolverMap<MOSIPPayload>,
): MOSIPPayload {
  const assignResolvers = <T extends object>(resolvers: ResolverMap<T>): T => {
    const result = {} as T;

    for (const key in resolvers) {
      const resolver = resolvers[key];

      if (typeof resolver === "function") {
        result[key] = resolver(bundle);
      } else if (resolver && typeof resolver === "object") {
        result[key] = assignResolvers(resolver) as T[Extract<keyof T, string>];
      }
    }

    return result;
  };

  return assignResolvers(resolverMap);
}
