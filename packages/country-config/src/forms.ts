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
export const esignet = (esignetAuthUrl: string, openIdProviderClientId: string, openIdProviderClaims: string, fieldName: string, callbackFieldName: string) => {

  const url = new URL(esignetAuthUrl)

  url.searchParams.append(
    'client_id',
    openIdProviderClientId || 'mock-client_id'
  )
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('scope', 'openid profile')
  url.searchParams.append('acr_values', 'mosip:idp:acr:static-code')
  url.searchParams.append('claims', openIdProviderClaims || 'mock-claims')
  url.searchParams.append('state', 'trigger-onmount')

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
    name: fieldName,
    validator: [],
    icon: {
      desktop: 'Globe',
      mobile: 'Fingerprint'
    },
    type: "REDIRECT",
    custom: true,
    label: {    
      id: 'views.idReader.label.eSignet',
      defaultMessage: 'E-signet'
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
          code: "esignet-mock-code",
        },      
        trigger: callbackFieldName
      },
    },
  };
};

export const popupButton = ({
  /** URL to OpenCRVS-MOSIP gateway (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org) */
  url
}: {
  url: string;
}) => {
  return {
    name: 'INFORMANT_AUTHENTICATION_POPUP_BUTTON',
    type: 'POPUP_BUTTON',
    url
  };
};

/**
 *
 * @description esignet callback button form definition.  Calls server/esignet-api /esignet/get-oidp-user-info (this field may not be supported in the latest release of OpenCRVS yet)
 *
 */

export const esignetCallback = ({
  fieldName,
  getOIDPUserInfoUrl,
  openIdProviderClientId 
}: {
  fieldName: string;
  getOIDPUserInfoUrl: string;
  openIdProviderClientId: string;
}) => ({
  name: fieldName,
  type: 'HTTP',
  custom: true,
  label: {
    id: 'form.field.label.empty',
    defaultMessage: ''
  },
  validator: [],
  options: {
    getOIDPUserInfoUrl,
    headers: {
      'Content-type': 'application/json'
    },
    body: {
      code: "esignet-mock-code",
      clientId: openIdProviderClientId,
      redirectUri: ""
    },
    method: 'POST'
  }
});

export const returnExpression = (fieldName: string) => {
  return {
    dependsOn: ["redirectCallbackFetch"],
    expression: `$form.redirectCallbackFetch?.data?.${fieldName}`,
  };
};

export const esignetHidden = () => {
  return {
    name: 'INFORMANT_PSUT_TOKEN',
    type: 'HIDDEN'
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
  readers: any[]
) => {
  const fieldName: string = 'idReader';
  const fieldId: string = `${event}.${sectionId}.${sectionId}-view-group.${fieldName}`;
  return {
    name: fieldName,
    customQuestionMappingId: fieldId,
    custom: true,
    required: false,
    type: 'ID_READER',
    label: {
      id: 'form.field.label.empty',
      defaultMessage: ''
    },
    hideInPreview: true,
    initialValue: '',
    validator: [],
    conditionals,
    dividerLabel: {
      id: 'views.idReader.label.or',
      defaultMessage: 'Or'
    },
    manualInputInstructionLabel: {
      id: 'views.idReader.label.manualInput',
      defaultMessage: 'Complete fields below'
    },
    readers
  };
};

export const qr = () => ({
  type: 'QR'
});



