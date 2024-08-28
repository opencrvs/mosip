import { env } from "./constants";

export const postRecord = async (record: any) => {
  const response = await fetch(env.MOSIP_RECEIVE_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify(record),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to post record to MOSIP. Status: ${
        response.status
      }, response: ${await response.text()}`
    );
  }

  return response.json();
};
