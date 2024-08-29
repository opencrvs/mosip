import { env } from "./constants";
import { ValidRecord } from "@opencrvs/commons/types";

export const postRecord = async ({
  record,
  token,
}: {
  record: ValidRecord;
  token: string;
}) => {
  const response = await fetch(env.MOSIP_RECEIVE_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({ record, token }),
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
