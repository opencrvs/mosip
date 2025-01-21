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
  event: string,
  sectionId: string,
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
  url.searchParams.append(
    "redirect_uri",
    '${window.location.origin}/drafts/${window.location.pathname.split("/")[2]}/events/${event}/${sectionId}/group/${sectionId}',
  );

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
 * @description esignet callback button form definition.  Calls mosip-api/esignet-api /esignet/get-oidp-user-info (this field may not be supported in the latest release of OpenCRVS yet)
 *
 */

export const esignetCallback = ({
  fieldName,
  event,
  sectionId,
  getOIDPUserInfoUrl,
  openIdProviderClientId,
}: {
  fieldName: string;
  event: string;
  sectionId: string;
  getOIDPUserInfoUrl: string;
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
    url: getOIDPUserInfoUrl,
    headers: {
      "Content-type": "application/json",
    },
    body: {
      clientId: openIdProviderClientId,
      redirectUri:
        '${window.location.origin}/drafts/${window.location.pathname.split("/")[2]}/events/${event}/${sectionId}/group/${sectionId}',
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

export const qr = () => ({
  type: "QR",
});

export const verified = (event: string, sectionId: string) => {
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
  };
};

export const idPendingVerificationBanner = (
  event: string,
  sectionId: string,
) => {
  const fieldName = "verified";
  const fieldId = `${event}.${sectionId}.${sectionId}-view-group.${fieldName}`;
  return {
    name: "idPending",
    type: "ID_VERIFICATION_BANNER",
    fieldId,
    hideInPreview: true,
    custom: true,
    bannerType: "pending",
    idFieldName: "idReader",
    label: {
      id: "form.field.label.empty",
      defaultMessage: "",
    },
    validator: [],
    conditionals: [
      {
        action: "hide",
        expression: '$form?.verified !== "pending"',
      },
    ],
  };
};

export const idVerificationFields = (event: string, sectionId: string) => {
  return [
    verified(event, sectionId),
    idPendingVerificationBanner(event, sectionId),
  ];
};
