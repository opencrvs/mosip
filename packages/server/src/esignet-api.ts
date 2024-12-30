/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */

import * as jwt from "jsonwebtoken";
import { env } from "./constants";
import fetch from "node-fetch";
import { logger } from "./logger";
import z from "zod";
import { FastifyReply, FastifyRequest } from "fastify";
import { promisify } from "util";
import { readFileSync } from "fs";

type OIDPUserAddress = {
  formatted: string;
  street_address: string;
  locality: string;
  region: string;
  postal_code: string;
  city: string;
  country: string;
};

type OIDPUserInfo = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: "female" | "male";
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: Partial<OIDPUserAddress>;
  updated_at?: number;
};

const OIDP_USERINFO_ENDPOINT =
  env.NATIONAL_ID_OIDP_REST_URL &&
  new URL("oidc/userinfo", env.NATIONAL_ID_OIDP_REST_URL).toString();
const OIDP_TOKEN_ENDPOINT =
  env.OIDP_REST_URL && new URL("oauth/token", env.OIDP_REST_URL).toString();
const CLIENT_ASSERTION_TYPE =
  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
const TOKEN_GRANT_TYPE = "authorization_code";
const cert = readFileSync(env.CERT_PRIVATE_KEY_PATH);
const JWT_ISSUER = "opencrvs:auth-service";
const AUDIENCE = [
  "opencrvs:gateway-user",
  "opencrvs:user-mgnt-user",
  "opencrvs:auth-user",
  "opencrvs:hearth-user",
  "opencrvs:notification-user",
  "opencrvs:workflow-user",
  "opencrvs:search-user",
  "opencrvs:metrics-user",
  "opencrvs:countryconfig-user",
  "opencrvs:webhooks-user",
  "opencrvs:config-user",
  "opencrvs:documents-user",
  "opencrvs:notification-api-user",
];

export const OIDPUserInfoSchema = z.object({
  code: z.string(),
  client_id: z.string(),
  redirect_uri: z.string(),
  grant_type: z.string(),
});

export type OIDPUserInfoRequest = FastifyRequest<{
  Body: z.infer<typeof OIDPUserInfoSchema>;
}>;

type FetchTokenProps = {
  code: string;
  client_id: string;
  redirect_uri: string;
  grant_type?: string;
};

const sign = promisify<
  Record<string, unknown>,
  jwt.Secret,
  jwt.SignOptions,
  string
>(jwt.sign);

export async function generateSignedJwt(
  clientId: string,
  scope: string[],
  audience: string[],
  issuer: string,
  temporary?: boolean
): Promise<string> {
  if (typeof clientId === undefined) {
    throw new Error("Invalid clientId found for token creation");
  }
  return sign({ scope }, cert, {
    subject: clientId,
    algorithm: "RS256",
    expiresIn: temporary
      ? env.CONFIG_SYSTEM_TOKEN_EXPIRY_SECONDS
      : env.CONFIG_TOKEN_EXPIRY_SECONDS,
    audience,
    issuer,
  });
}

const fetchToken = async ({
  code,
  client_id,
  redirect_uri,
  grant_type = TOKEN_GRANT_TYPE,
}: FetchTokenProps) => {
  const body = new URLSearchParams({
    code: code,
    client_id: client_id,
    redirect_uri: redirect_uri,
    grant_type: grant_type,
    client_assertion_type: CLIENT_ASSERTION_TYPE,
    client_assertion: await generateSignedJwt(
      client_id,
      ["verify"],
      AUDIENCE,
      JWT_ISSUER,
      false
    ),
  });

  const request = await fetch(OIDP_TOKEN_ENDPOINT!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  
  const response = await request.json();
  return response as { access_token?: string };
};

export const getOIDPUserInfo = async (
  request: OIDPUserInfoRequest,
  reply: FastifyReply
) => {
  const { code, client_id, redirect_uri, grant_type } = request.body;
  const tokenResponse = await fetchToken({
    code,
    client_id,
    redirect_uri,
    grant_type,
  });

  if (!tokenResponse.access_token) {
    throw new Error(
      "Something went wrong with the OIDP token request. No access token was returned. Response from OIDP: " +
        JSON.stringify(tokenResponse)
    );
  }

  return fetchUserInfo(tokenResponse.access_token);
};

const decodeUserInfoResponse = (response: string) => {
  return jwt.decode(response) as OIDPUserInfo;
};

export const fetchLocationFromFHIR = <T = any>(
  suffix: string,
  method = "GET",
  body: string | undefined = undefined
): Promise<T> => {
  return fetch(`${env.GATEWAY_URL}${suffix}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body,
  })
    .then((response) => {
      return response.json();
    })
    .catch((error) => {
      return Promise.reject(
        new Error(`Fetch Location from FHIR request failed: ${error.message}`)
      );
    });
};

const searchLocationFromFHIR = (name: string) =>
  fetchLocationFromFHIR<fhir2.Bundle>(
    `/locations?${new URLSearchParams({ name, type: "ADMIN_STRUCTURE" })}`
  );

const findAdminStructureLocationWithName = async (name: string) => {
  const fhirBundleLocations = await searchLocationFromFHIR(name);

  if ((fhirBundleLocations.entry?.length ?? 0) > 1) {
    throw new Error(
      "Multiple admin structure locations found with the same name"
    );
  }

  if ((fhirBundleLocations.entry?.length ?? 0) === 0) {
    logger.warn("No admin structure location found with the name: " + name);
    return null;
  }

  return fhirBundleLocations.entry?.[0].resource?.id;
};

const pickUserInfo = async (userInfo: OIDPUserInfo) => {
  const stateFhirId =
    userInfo.address?.country &&
    (await findAdminStructureLocationWithName(userInfo.address.country));

  return {
    oidpUserInfo: userInfo,
    stateFhirId,
    districtFhirId:
      userInfo.address?.region &&
      (await findAdminStructureLocationWithName(userInfo.address.region)),
    locationLevel3FhirId:
      userInfo.address?.locality &&
      (await findAdminStructureLocationWithName(userInfo.address.locality)),
  };
};

export const fetchUserInfo = async (accessToken: string) => {
  const request = await fetch(OIDP_USERINFO_ENDPOINT!, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  const response = await request.text();
  const decodedResponse = decodeUserInfoResponse(response);

  logger.info(`OIDP user info response: ${JSON.stringify(decodedResponse)}`);

  return pickUserInfo(decodedResponse);
};
