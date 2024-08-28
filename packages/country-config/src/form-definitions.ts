// @TODO: we could start building these definitions to core tbh
// @TODO: add renovate or something to listen for core updates and create a PRs, then we get an error message if we have broken this

/**
 * E-Signet popup button form definition
 */
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
  url,
}: {
  /** URL to OpenCRVS-MOSIP gateway (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org) */
  url: string;
}) => [popupButton({ url }), hidden()];
