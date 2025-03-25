type IdentityInfo = { value: string; language: string };

interface MOSIPPayload
  extends Record<string, IdentityInfo[] | string | boolean> {
  fullName: IdentityInfo[];
  dateOfBirth: string;
  gender: IdentityInfo[];
  guardianOrParentName: IdentityInfo[];
  nationalIdNumber: string;
  passportNumber: string;
  drivingLicenseNumber: string;
  deceasedStatus: boolean;
  residentStatus: IdentityInfo[];
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
}

type Resolver = (bundle: fhir3.Bundle) => MOSIPPayload[keyof MOSIPPayload];
type ResolverMap = {
  [K in keyof MOSIPPayload]: Resolver;
};

export function fhirBundleToMOSIPPayload(
  bundle: fhir3.Bundle,
  resolverMap: ResolverMap,
): MOSIPPayload {
  const payload = {} as MOSIPPayload;
  for (const [key, resolver] of Object.entries(resolverMap)) {
    payload[key] = resolver(bundle);
  }
  return payload as MOSIPPayload;
}
