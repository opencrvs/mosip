export const formPopupButton = ({
  url,
}: {
  /**
   * URL to OpenCRVS-MOSIP Nid Authenticator (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org)
   */
  url: string;
}) => {
  return {
    type: "POPUP_BUTTON",
    url,
  };
};
