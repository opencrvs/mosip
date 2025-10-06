import type { EventDocument, FieldValue } from "@opencrvs/toolkit/events";

export interface BirthRequestFields extends Record<string, unknown> {
  birthCertificateNumber: string;
  deathCertificateNumber?: undefined;
}

export interface DeathRequestFields extends Record<string, unknown> {
  deathCertificateNumber: string;
  birthCertificateNumber?: undefined;
}

export interface MosipInteropPayload {
  trackingId: string;
  notification: {
    recipientFullName: string;
    recipientEmail: string;
    recipientPhone: string;
  };
  requestFields: BirthRequestFields | DeathRequestFields;
  metaInfo: Record<string, unknown>;
  audit: Record<string, unknown>;
}

export interface VerifyNidPayload {
  nid: FieldValue;
  gender?: FieldValue;
  dob: FieldValue;
  name: FieldValue;
  /** Adds logging of the auth status using this id to mosip-api */
  transactionId?: string;
}

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
    register: async (payload: MosipInteropPayload) => {
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
    verifyNid: async (payload: VerifyNidPayload) => {
      const MOSIP_API_VERIFY_URL = new URL("./verify", url).href;

      const response = await fetchWithTimeout(MOSIP_API_VERIFY_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          Authorization: authorizationHeader,
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to register event: ${await response.text()}`);
      }

      return response.text() as Promise<"verified" | "failed">;
    },
  };
};
