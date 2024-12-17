// @TODO: Yet to be implemented! Placeholders for NPM publish.

/**
 * E-Signet REDIRECT button form definition.  Calls E-Signet /authorize
 */


export const returnRedirectFormField = (esignetAuthUrl: string, openIdProviderClientId: string, openIdProviderClaims: string) => {
  // `${nidSystemSetting?.openIdProviderBaseUrl}authorize`
  const url = new URL(esignetAuthUrl)

  url.searchParams.append(
    'client_id',
    openIdProviderClientId || ''
  )
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('scope', 'openid profile')
  url.searchParams.append('acr_values', 'mosip:idp:acr:static-code')
  url.searchParams.append('claims', openIdProviderClaims || '')

  /*

  TODO: Understand from Tahmid about how to handle this:
  
  url.searchParams.append(
    'redirect_uri',
    `${window.location.origin}${OIDP_VERIFICATION_CALLBACK}`
  )
  const stateToBeSent: INidCallbackState = {
    pathname: currentPathname,
    declarationId: declarationId,
    section: currentSection
  }
  url.searchParams.append('state', JSON.stringify(stateToBeSent))
  */
  window.location.href = url.toString()

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
