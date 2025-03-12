type IdentityInfo = { value: string; language: string };

interface AuthParams {
  individualId: string;
  individualIdType: string;
  demographicData: {
    dob: string | undefined;
    name: IdentityInfo[] | undefined;
    gender: IdentityInfo[] | undefined;
  };
  consent: boolean;
}

interface MosipErrorObject {
  errorCode: string;
  errorMessage: string;
  actionMessage?: string;
}

// TODO: replace with alpha-3 maybe? need to double check
const MOSIP_SUPPORTED_LANGUAGE_CODES = ["eng", "ara", "fra"];

function isValidDateFormat(dateString: string) {
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;

  if (!regex.test(dateString)) {
    return false;
  }

  const parts = dateString.split("/");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

function deduplicateArrayByKey<T>(arr: T[], key: keyof T) {
  const seen = new Set();
  return arr.filter((item) => {
    const keyValue = item[key];
    if (seen.has(keyValue)) {
      return false;
    } else {
      seen.add(keyValue);
      return true;
    }
  });
}

function validateIdentityInfo(identityInfo: IdentityInfo[]) {
  const identityInfoErrors: MosipErrorObject[] = [];
  if (identityInfo.some((info) => !info.value)) {
    identityInfoErrors.push({
      errorCode: "IDA-MLC-013",
      errorMessage: "Missing demo auth attribute",
    });
  }
  if (identityInfo.some((name) => !name.language)) {
    identityInfoErrors.push({
      errorCode: "IDA-MLC-006",
      errorMessage: "Missing Input Parameter - LanguageCode",
    });
  }
  const unsupported = identityInfo.find(
    (info) =>
      info.language && !MOSIP_SUPPORTED_LANGUAGE_CODES.includes(info.language),
  );
  if (unsupported) {
    identityInfoErrors.push({
      errorCode: "IDA-DEA-002",
      errorMessage: `Unsupported Language Code - request : ${unsupported.language}`,
      actionMessage: "Please provide valid Language",
    });
  }
  return identityInfoErrors;
}

export function validate(authParams: AuthParams) {
  const errors: MosipErrorObject[] = [];

  if (
    !authParams.demographicData ||
    Object.keys(authParams.demographicData).length === 0
  ) {
    errors.push({
      errorCode: "IDA-MLC-008",
      errorMessage: "No authentication type selected",
    });
  }

  if (
    authParams.demographicData?.dob &&
    !isValidDateFormat(authParams.demographicData.dob)
  ) {
    errors.push({
      errorCode: "IDA-MLC-009",
      errorMessage: "Invalid Input Parameter - request/demographics/dob",
    });
  }

  if (
    authParams.demographicData?.name &&
    authParams.demographicData.name.length > 0
  ) {
    errors.push(...validateIdentityInfo(authParams.demographicData.name));
  }
  if (
    authParams.demographicData?.gender &&
    authParams.demographicData.gender.length > 0
  ) {
    errors.push(...validateIdentityInfo(authParams.demographicData.gender));
  }

  return deduplicateArrayByKey(errors, "errorCode");
}
