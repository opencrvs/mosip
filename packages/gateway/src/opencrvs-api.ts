import { env } from "./constants";
import * as database from "./database";

/**
 * Posts the confirm registration to OpenCRVS as GraphQL mutation
 */
export const postConfirmRegistration = async ({
  recordId,
  nid,
}: {
  recordId: string;
  nid: string;
}) => {
  const response = await fetch(env.OPENCRVS_GRAPHQL_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${database.read(recordId)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operationName: "confirmRegistration",
      query: `mutation confirmRegistration($recordId: String!, $nid: String!) {
        confirmRegistration(input: { recordId: $recordId, nid: $nid }) {
          id
        }
      }`,
      variables: {
        recordId,
        nid,
      },
    }),
  });

  database.remove(recordId);

  if (!response.ok) {
    throw new Error(
      `Failed to confirm registration in OpenCRVS. Status: ${
        response.status
      }, response: ${await response.text()}`
    );
  }

  return response.json();
};
