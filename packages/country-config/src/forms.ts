// @TODO: Yet to be implemented! Placeholders for NPM publish.

/**
 * E-Signet popup button and hidden field form definitions
 * @example
 * ```
 * [
 *   // ...other fields
 *   ...esignet({ url: "https://opencrvs-mosip-gateway.farajaland.opencrvs.org" })
 * ]
 * ```
 */

/**
 *
 * @description E-Signet REDIRECT button form definition.  Calls E-Signet /authorize (this field may not be supported in the latest release of OpenCRVS yet)
 *
 */
export const esignet = (
  esignetAuthUrl: string,
  openIdProviderClientId: string,
  openIdProviderClaims: string = "name,family_name,given_name,middle_name,birthdate,address",
  fieldName: string,
  callbackFieldName: string,
) => {
  const url = new URL(esignetAuthUrl);

  url.searchParams.append(
    "client_id",
    openIdProviderClientId || "mock-client_id",
  );
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", "openid profile");
  url.searchParams.append("acr_values", "mosip:idp:acr:static-code");
  url.searchParams.append("claims", openIdProviderClaims);
  url.searchParams.append("state", "fetch-on-mount");
  url.searchParams.append("redirect_uri", "${window.location.href}");

  return {
    name: fieldName,
    validator: [],
    icon: {
      desktop: "Globe",
      mobile: "Fingerprint",
    },
    type: "LINK_BUTTON",
    custom: true,
    label: {
      id: "views.idReader.label.eSignet",
      defaultMessage: "E-signet",
    },
    hideInPreview: true,
    conditionals: [
      {
        action: "disable",
        expression: "!!$form.redirectCallbackFetch",
      },
    ],
    options: {
      url: url.toString(),
      callback: {
        params: {
          state: "fetch-on-mount",
        },
        trigger: callbackFieldName,
      },
    },
  };
};

export const popupButton = ({
  /** URL to OpenCRVS-MOSIP gateway (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org) */
  url,
}: {
  url: string;
}) => {
  return {
    name: "INFORMANT_AUTHENTICATION_POPUP_BUTTON",
    type: "POPUP_BUTTON",
    url,
  };
};

/**
 *
 * @description esignet callback button form definition.  Calls https://mosip-api.{{hostname}}/esignet/get-oidp-user-info
 *
 */

export const esignetCallback = ({
  fieldName,
  mosipAPIUserInfoUrl,
  openIdProviderClientId,
}: {
  fieldName: string;
  mosipAPIUserInfoUrl: string;
  openIdProviderClientId: string;
}) => ({
  name: fieldName,
  type: "HTTP",
  custom: true,
  label: {
    id: "form.field.label.empty",
    defaultMessage: "",
  },
  validator: [],
  hideInPreview: true,
  options: {
    url: mosipAPIUserInfoUrl,
    headers: {
      "Content-type": "application/json",
    },
    body: {
      clientId: openIdProviderClientId,
      redirectUri: "${window.location.href}",
    },

    method: "POST",
  },
});

export const esignetHidden = () => {
  return {
    name: "INFORMANT_PSUT_TOKEN",
    type: "HIDDEN",
  };
};

/**
 *
 * @description QR reader type definition (this field may not be supported in the latest release of OpenCRVS yet)
 *
 */

export const idReader = (
  event: string,
  sectionId: string,
  conditionals: any[],
  readers: any[],
) => {
  const fieldName: string = "idReader";
  const fieldId: string = `${event}.${sectionId}.${sectionId}-view-group.${fieldName}`;
  return {
    name: fieldName,
    customQuestionMappingId: fieldId,
    custom: true,
    required: false,
    type: "ID_READER",
    label: {
      id: "form.field.label.empty",
      defaultMessage: "",
    },
    hideInPreview: true,
    initialValue: "",
    validator: [],
    conditionals,
    dividerLabel: {
      id: "views.idReader.label.or",
      defaultMessage: "Or",
    },
    manualInputInstructionLabel: {
      id: "views.idReader.label.manualInput",
      defaultMessage: "Complete fields below",
    },
    readers,
  };
};

type MessageDescriptor = {
  id: string;
  defaultMessage: string;
  description?: string;
};

export const qr = ({
  validation,
}: {
  validation: {
    rule: Record<string, unknown>;
    errorMessage: MessageDescriptor;
  };
}) => ({
  type: "QR",
  validation,
});

export const verified = (event: string, sectionId: string, mapping: any) => {
  const fieldName = "verified";
  const fieldId = `${event}.${sectionId}.${sectionId}-view-group.${fieldName}`;
  return {
    name: "verified",
    fieldId,
    customQuestionMappingId: fieldId,
    type: "HIDDEN",
    custom: true,
    label: {
      id: "form.field.label.empty",
      defaultMessage: "",
    },
    initialValue: {
      dependsOn: ["idReader"],
      expression: 'Boolean($form?.idReader)? "pending":""',
    },
    validator: [],
    mapping
  };
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const idVerificationBanner = (
  event: string,
  sectionId: string,
  status: "pending" | "verified" | "failed",
) => {
  const fieldName = "verified";
  const fieldId = `${event}.${sectionId}.${sectionId}-view-group.${fieldName}`;
  return {
    name: `id${capitalize(status)}.`,
    type: "ID_VERIFICATION_BANNER",
    fieldId,
    hideInPreview: true,
    custom: true,
    bannerType: status,
    idFieldName: "idReader",
    label: {
      id: "form.field.label.empty",
      defaultMessage: "",
    },
    validator: [],
    conditionals: [
      {
        action: "hide",
        expression: `$form?.verified !== "${status}"`,
      },
    ],
  };
};

export const idVerificationFields = (event: string, sectionId: string, mapping: any) => {
  return [
    verified(event, sectionId, mapping),
    idVerificationBanner(event, sectionId, "pending"),
    idVerificationBanner(event, sectionId, "verified"),
    idVerificationBanner(event, sectionId, "failed"),
  ];
};
