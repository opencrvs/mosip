import type * as Hapi from "@hapi/hapi";
import fetch from "node-fetch";

export const mosipRegistrationHandler = ({ url }: { url: string }) =>
  (async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
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
  }) satisfies Hapi.ServerRoute["handler"];
