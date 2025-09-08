import { env } from "./constants";
import { createClient } from "@opencrvs/toolkit/api";

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

export const confirmRegistration = (
  {
    eventId,
    actionId,
    nationalId,
    registrationNumber,
  }: {
    eventId: string;
    actionId: string;
    nationalId?: string;
    registrationNumber?: string;
  },
  { token }: { token: string },
) => {
  const url = new URL("events", env.OPENCRVS_GATEWAY_URL).toString();
  const client = createClient(url, `Bearer ${token}`);

  return client.event.actions.register.accept.mutate({
    eventId,
    actionId,
    nationalId,
    registrationNumber,
  });
};

// export const rejectRegistration = (
//   id: string,
//   { reason, comment }: { reason: string; comment: string },
//   { headers }: { headers: Record<string, any> },
// ) =>
//   post({
//     query: /* GraphQL */ `
//       mutation rejectRegistration(
//         $id: ID!
//         $details: RejectRegistrationInput!
//       ) {
//         rejectRegistration(id: $id, details: $details)
//       }
//     `,
//     variables: {
//       id,
//       details: {
//         reason,
//         comment,
//       },
//     },
//     headers,
//   });

// export const upsertRegistrationIdentifier = (
//   {
//     id,
//     identifierType,
//     identifierValue,
//   }: {
//     id: string;
//     identifierType: string;
//     identifierValue: string;
//   },
//   { headers }: { headers: Record<string, any> },
// ) =>
//   post({
//     query: /* GraphQL */ `
//       mutation upsertRegistrationIdentifier(
//         $id: ID!
//         $identifierType: String!
//         $identifierValue: String!
//       ) {
//         upsertRegistrationIdentifier(
//           id: $id
//           identifierType: $identifierType
//           identifierValue: $identifierValue
//         )
//       }
//     `,
//     variables: {
//       id,
//       identifierType,
//       identifierValue,
//     },
//     headers,
//   });

// export const updateField = (
//   id: string,
//   fieldId: string,
//   valueString: string,
//   { headers }: { headers: Record<string, any> },
// ) =>
//   post({
//     query: /* GraphQL */ `
//       mutation updateField($id: ID!, $details: UpdateFieldInput!) {
//         updateField(id: $id, details: $details)
//       }
//     `,
//     variables: { id, details: { fieldId, valueString } },
//     headers,
//   });
