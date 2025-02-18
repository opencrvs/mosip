import type * as Hapi from "@hapi/hapi";
import fetch from "node-fetch";

interface VerificationStatus {
  father: boolean;
  mother: boolean;
  informant: boolean;
}

/**
 * Replaces event registration handler in country config
 */
export const mosipRegistrationHandler = ({ url }: { url: string }) =>
  (async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    // Corresponds to `packages/mosip-api` /events/registration -route
    const MOSIP_API_REGISTRATION_EVENT_URL = new URL(
      "./events/registration",
      url,
    );

    const response = await fetch(MOSIP_API_REGISTRATION_EVENT_URL, {
      method: "POST",
      body: JSON.stringify(request.payload),
      headers: {
        ...request.headers,
        "content-type": "application/json",
      },
    });

    if (!response.ok) {
      return h
        .response({
          error: "OpenCRVS-MOSIP event registration route did not return a 200",
          response: await response.text(),
        })
        .code(500);
    }

    return h.response({ success: true }).code(200);
  }) satisfies Hapi.ServerRoute["handler"];

/**
 * Replaces `/events/{event}/actions/sent-notification-for-review` handler in country config
 */
export const mosipRegistrationForReviewHandler = ({ url }: { url: string }) =>
  (async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    // Corresponds to `packages/mosip-api` /events/review -route
    let response;
    try {
      response = await verify({ url, request });
    } catch (error) {
      return h
        .response({
          error: "OpenCRVS-MOSIP event review route did not return a 200",
          response: error instanceof Error ? error.message : "Unknown error",
        })
        .code(500);
    }

    return h.response(response).code(200);
  }) satisfies Hapi.ServerRoute["handler"];

/**
 * Replaces `/events/{event}/actions/sent-for-approval` handler in country config
 * Currently the same as `/events/{event}/actions/sent-notification-for-review`
 */
export const mosipRegistrationForApprovalHandler =
  mosipRegistrationForReviewHandler;

export const verify = async ({
  url,
  request,
}: {
  url: string;
  request: Hapi.Request;
}): Promise<Partial<VerificationStatus>> => {
  const MOSIP_API_REVIEW_EVENT_URL = new URL("./events/review", url);

  const response = await fetch(MOSIP_API_REVIEW_EVENT_URL, {
    method: "POST",
    body: JSON.stringify(request.payload),
    headers: {
      ...request.headers,
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) satisfies Partial<VerificationStatus>;
};
