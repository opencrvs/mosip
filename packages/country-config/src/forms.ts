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

export const idReader = ({ url }) => {
  return {
    name: 'informantIDReader',
    type: 'ID_READER',
    readers: [
      {
        type: 'qr',
        labels: {
          button: {
            id: 'id.qr.button.label',
            defaultMessage: 'Scan ID QR code'
          },
          scannerDialogSupportingCopy: {
            id: 'id.qr.scanner.supportingCopy',
            defaultMessage:
              "Place the Notifier's ID card in front of the camera."
          },
          tutorial: {
            cameraCleanliness: {
              id: 'id.qr.tutorial.cameraCleanliness',
              defaultMessage: 'Ensure your camera is clean and functional.'
            },
            distance: {
              id: 'id.qr.tutorial.distance',
              defaultMessage:
                'Hold the device steadily 6-12 inches away from the QR code.'
            },
            lightBalance: {
              id: 'id.qr.tutorial.lightBalance',
              defaultMessage:
                'Ensure the QR code is well-lit and not damaged or blurry.'
            }
          }
        }
      }
      // {
      //   type: 'e-signet',
      //   ...otherProperties
      // }
    ]
  };
};
export const esignet = ({
  url
}: {
  /** URL to OpenCRVS-MOSIP gateway (e.g. https://opencrvs-mosip-gateway.farajaland.opencrvs.org) */
  url: string;
}) => [popupButton({ url }), hidden()];
