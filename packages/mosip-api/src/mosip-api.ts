import { env } from "./constants";

export class MOSIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MOSIPError";
  }
}

export const postBirthRecord = async ({
  event,
  token,
}: {
  event: {
    id: string;
    trackingId: string;
  };
  token: string;
}) => {
  const response = await fetch(env.MOSIP_BIRTH_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({ event, token }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new MOSIPError(
      `Failed to post record to MOSIP. Status: ${
        response.status
      }, response: ${await response.text()}`,
    );
  }

  return response.json() as Promise<{
    aid: string;
  }>;
};

export const deactivateNid = async ({ nid }: { nid: string }) => {
  const response = await fetch(env.MOSIP_DEATH_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({ nid }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
};

export const verifyNid = async ({ nid: _nid }: { nid: string }) => {
  // @TODO: Implement verification via mock MOSIP API & actual MOSIP API
  return true;
};
