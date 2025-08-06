import { MOSIPPayload as StrictMOSIPPayload } from "./transform";

/**
 * The v1.8 `@opencrvs/mosip` type asserts that all fields are required due to the way the transformer works.
 * This type is a more relaxed version that allows for partial payloads.
 */
export type MOSIPPayload = Partial<StrictMOSIPPayload>;

export interface VerificationStatus {
  father: boolean;
  mother: boolean;
  informant: boolean;
  deceased: boolean;
  spouse: boolean;
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = 15000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export const createMosipInteropClient = (
  url: string,
  authorizationHeader: string,
) => {
  return {
    register: async (payload: MOSIPPayload) => {
      const MOSIP_API_REGISTRATION_EVENT_URL = new URL(
        "./events/registration",
        url,
      ).href;

      const response = await fetchWithTimeout(
        MOSIP_API_REGISTRATION_EVENT_URL,
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            Authorization: authorizationHeader,
            "content-type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to register event: ${await response.text()}`);
      }

      return response.json();
    },
  };
};
