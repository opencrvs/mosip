// @TODO: Yet to be implemented! Placeholders for NPM publish.

/**
 * E-Signet popup button form definition
 */
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

export const hidden = () => {
  return {
    name: 'INFORMANT_PSUT_TOKEN',
    type: 'HIDDEN'
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

export const esignet = ({
  url,
  callbackFieldName
}: {
  url: string;
  callbackFieldName: string;
}) => ({
  name: 'redirect',
  validator: [],
  icon: {
    desktop: 'Globe',
    mobile: 'Fingerprint'
  },
  type: 'REDIRECT',
  label: {
    id: 'views.idReader.label.eSignet',
    defaultMessage: 'E-signet'
  },
  options: {
    url,
    callback: {
      params: {
        authorized: 'true'
      },
      trigger: callbackFieldName
    }
  }
});

export const esignetCallback = ({
  fieldName,
  url
}: {
  fieldName: string;
  url: string;
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
    url,
    headers: {
      'Content-type': 'application/json'
    },
    method: 'GET'
  }
});

// export const esignet = ({
//   url
// }: {
//   /** URL to OpenCRVS-MOSIP gateway (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org) */
//   url: string;
// }) => [popupButton({ url }), hidden()];
