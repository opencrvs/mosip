import { env } from "./constants";

export class OpenCRVSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenCRVSError";
  }
}

/** Communicates with opencrvs-core's GraphQL gateway */
const post = async <T = any>({
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
      `POST to OpenCRVS GraphQL Gateway not ok: ${await response.text()}`
    );
  }

  return response.json() as Promise<{ data: T }>;
};

export const confirmRegistration = (
  {
    id,
    identifiers,
    registrationNumber,
  }: {
    id: string;
    identifiers: Array<{ type: string; value: string }>;
    registrationNumber: string;
  },
  { headers }: { headers: Record<string, any> }
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
      },
    },
    headers,
  });

export const rejectRegistration = (
  id: string,
  { reason, comment }: { reason: string; comment: string },
  { headers }: { headers: Record<string, any> }
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
  { headers }: { headers: Record<string, any> }
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

export const getOIDPUserInfo = (
  {
    code,
    clientId,
    redirectUri,
    grantType,
  }: {
    code: String;
    clientId: String;
    redirectUri: String;
    grantType: String;
  },
  { headers }: { headers: Record<string, any> }
) =>
  post({
    query: /* GraphQL */ `
      mutation getOIDPUserInfo(
        $code: String!
        $clientId: String!
        $redirectUri: String!
        $grantType: String
      ) {
        getOIDPUserInfo(
          code: $code
          clientId: $clientId
          redirectUri: $redirectUri
          grantType: $grantType
        ) {
          oidpUserInfo {
            sub
            name
            given_name
            family_name
            middle_name
            nickname
            preferred_username
            profile
            picture
            website
            email
            email_verified
            gender
            birthdate
            zoneinfo
            locale
            phone_number
            phone_number_verified
            address {
              formatted
              street_address
              locality
              region
              postal_code
              city
              country
            }
            updated_at
          }
          districtFhirId
          stateFhirId
          locationLevel3FhirId
        }
      }
    `,
    variables: {
      code,
      clientId,
      redirectUri,
      grantType,
    },
    headers,
  });
