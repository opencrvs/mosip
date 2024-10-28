import { env } from "./constants";

/**
 * Posts the confirm registration to OpenCRVS as GraphQL mutation
 */
export const postConfirmRegistration = async ({
  recordId,
  nid,
  token,
}: {
  recordId: string;
  nid: string;
  token: string;
}) => {
  const response = await fetch(env.OPENCRVS_GRAPHQL_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: /* GraphQL */ `
        mutation confirmRegistration($recordId: String!, $nid: String!) {
          confirmRegistration(input: { recordId: $recordId, nid: $nid }) {
            id
          }
        }
      `,
      variables: {
        recordId,
        nid,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to confirm registration in OpenCRVS. Status: ${
        response.status
      }, response: ${await response.text()}`
    );
  }

  return response.json();
};
