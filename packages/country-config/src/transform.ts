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
    fullName: IdentityInfo[];
    dateOfBirth: string;
    gender: IdentityInfo[];
    guardianOrParentName: IdentityInfo[];
    nationalIdNumber: string;
    passportNumber: string;
    drivingLicenseNumber: string;
    deceasedStatus: boolean;
    residenceStatus: IdentityInfo[];
    vid: string;
    email: string;
    phone: string;
    guardianOrParentBirthCertificateNumber: string;
    birthCertificateNumber: string;
    addressLine1: IdentityInfo[];
    addressLine2: IdentityInfo[];
    addressLine3: IdentityInfo[];
    district: IdentityInfo[];
    village: IdentityInfo[];
    birthRegistrationCertificate: string;
    passportId: string;
    nationalId: string;
    drivingLicenseId: string;
    addressProof: string;
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
