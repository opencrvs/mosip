// @TODO: Yet to be implemented! Placeholders for NPM publish.

/**
 * E-Signet popup button form definition
 */
export const returnRedirectFormField = (esignetAuthUrl: string) => {
  return {
    name: "redirect",
    type: "REDIRECT",
    custom: true,
    label: {
      id: "form.field.label.redirect",
      defaultMessage: "Click here to authorize",
    },
    hideInPreview: true,
    conditionals: [
      {
        action: "disable",
        expression: "!!$form.redirectCallbackFetch",
      },
    ],
    options: {
      url: esignetAuthUrl,
      callback: {
        params: {
          authorized: "true",
        },
        trigger: "redirectCallbackFetch",
      },
    },
    validator: [],
  };
};

export const returnCallbackFormField = (esignetUserinfoUrl: string) => {
  return {
    name: "redirectCallbackFetch",
    type: "HTTP",
    custom: true,
    label: {
      id: "form.field.label.empty",
      defaultMessage: " ",
    },
    options: {
      url: esignetUserinfoUrl,
      method: "GET",
    },
    validator: [],
  };
};

export const returnExpression = (fieldName: string) => {
  return {
    dependsOn: ["redirectCallbackFetch"],
    expression: `$form.redirectCallbackFetch?.data?.${fieldName}`,
  };
};

export const hidden = () => {
  return {
    name: "INFORMANT_PSUT_TOKEN",
    type: "HIDDEN",
  };
};

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
export const esignet = ({
  esignetAuthUrl,
  esignetUserinfoUrl,
  fieldName,
}: {
  /** URL to OpenCRVS-MOSIP gateway (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org) */
  esignetAuthUrl: string;
  esignetUserinfoUrl: string;
  fieldName: string;
}) => [
  returnRedirectFormField(esignetAuthUrl),
  returnCallbackFormField(esignetUserinfoUrl),
  returnExpression(fieldName),
  hidden(),
];
