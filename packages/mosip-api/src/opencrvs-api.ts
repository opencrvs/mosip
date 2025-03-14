import { env } from "./constants";

export class OpenCRVSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenCRVSError";
  }
}

/** Fetches the public key from OpenCRVS to be able to verify JWTs */
export const getPublicKey = async (): Promise<string> => {
  try {
    const response = await fetch(env.OPENCRVS_PUBLIC_KEY_URL);
    return response.text();
  } catch (error) {
    console.error(
      `🔑  Failed to fetch public key from Core. Make sure Core is running, and you are able to connect to ${env.OPENCRVS_PUBLIC_KEY_URL}`,
    );
    if (env.isProd) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return getPublicKey();
  }
};

/** Communicates with opencrvs-core's GraphQL gateway */
const post = async ({
  query,
  variables,
  headers,
}: {
  query: string;
  variables: Record<string, any>;
  headers: Record<string, any>;
}) => {
  const response = await fetch(env.OPENCRVS_GRAPHQL_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      variables,
      query,
    }),
  });

  if (!response.ok) {
    throw new OpenCRVSError(
      `POST to OpenCRVS GraphQL Gateway not ok: ${await response.text()}`,
    );
  }

  return response;
};

export const confirmRegistration = (
  {
    id,
    identifiers,
    registrationNumber,
    comment,
  }: {
    id: string;
    identifiers?: Array<{ type: string; value: string }>;
    registrationNumber: string;
    comment?: string;
  },
  { headers }: { headers: Record<string, any> },
) =>
  post({
    query: /* GraphQL */ `
      mutation confirmRegistration(
        $id: ID!
        $details: ConfirmRegistrationInput!
      ) {
        confirmRegistration(id: $id, details: $details)
      }
    `,
    variables: {
      id,
      details: {
        identifiers,
        registrationNumber,
        comment,
      },
    },
    headers,
  });

export const rejectRegistration = (
  id: string,
  { reason, comment }: { reason: string; comment: string },
  { headers }: { headers: Record<string, any> },
) =>
  post({
    query: /* GraphQL */ `
      mutation rejectRegistration(
        $id: ID!
        $details: RejectRegistrationInput!
      ) {
        rejectRegistration(id: $id, details: $details)
      }
    `,
    variables: {
      id,
      details: {
        reason,
        comment,
      },
    },
    headers,
  });

export const upsertRegistrationIdentifier = (
  {
    id,
    identifierType,
    identifierValue,
  }: {
    id: string;
    identifierType: string;
    identifierValue: string;
  },
  { headers }: { headers: Record<string, any> },
) =>
  post({
    query: /* GraphQL */ `
      mutation upsertRegistrationIdentifier(
        $id: ID!
        $identifierType: String!
        $identifierValue: String!
      ) {
        upsertRegistrationIdentifier(
          id: $id
          identifierType: $identifierType
          identifierValue: $identifierValue
        )
      }
    `,
    variables: {
      id,
      identifierType,
      identifierValue,
    },
    headers,
  });

export const updateField = (
  id: string,
  fieldId: string,
  valueString: string,
  { headers }: { headers: Record<string, any> },
) =>
  post({
    query: /* GraphQL */ `
      mutation updateField($id: ID!, $details: UpdateFieldInput!) {
        updateField(id: $id, details: $details)
      }
    `,
    variables: { id, details: { fieldId, valueString } },
    headers,
  });
