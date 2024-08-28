import type * as Hapi from "@hapi/hapi";
import fetch from "node-fetch";

export const mosipExternalValidation = ({ url }: { url: string }) =>
  ({
    path: "/events/waiting-external-validation",
    method: "POST",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      const OPENCRVS_MOSIP_GATEWAY_URL = new URL("./webhooks/opencrvs", url);

      const response = await fetch(OPENCRVS_MOSIP_GATEWAY_URL, {
        method: "POST",
        body: JSON.stringify(request.payload),
        headers: request.headers,
      });

      if (!response.ok) {
        return h
          .response({
            error: "OpenCRVS-MOSIP gateway did not return a 200",
            response: await response.text(),
          })
          .code(500);
      }

      return h.response({ success: true }).code(200);
    },
    options: {
      tags: ["api", "event"],
      description: "Handles event waiting for external validation",
    },
  } satisfies Hapi.ServerRoute);
