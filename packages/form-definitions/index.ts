/**
 * E-Signet popup button form definition
 * @param url URL to OpenCRVS-MOSIP gateway (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org)
 */
export const popupButton = ({ url }: { url: string }) => {
  return {
    name: "INFORMANT_AUTHENTICATION_POPUP_BUTTON",
    type: "POPUP_BUTTON",
    url,
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
 * @param url URL to OpenCRVS-MOSIP gateway (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org)
 * @example
 * ```
 * [
 *   // ...other fields
 *   ...esignet({ url: "https://opencrvs-mosip-gateway.farajaland.opencrvs.org" })
 * ]
 * ```
 */
export const esignet = ({ url }: { url: string }) => [
  popupButton({ url }),
  hidden(),
];
