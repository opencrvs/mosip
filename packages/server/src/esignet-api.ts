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
import * as opencrvs from "./opencrvs-api";

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

export const OIDPUserInfoSchema = z.object({
  code: z.string(),
  clientId: z.string(),
  redirectUri: z.string(),
  grantType: z.string(),
});

export type OIDPUserInfoRequest = FastifyRequest<{
  Body: z.infer<typeof OIDPUserInfoSchema>;
}>;

export const getOIDPUserInfo = async (
    request: OIDPUserInfoRequest,
    reply: FastifyReply
  ) => {
    const { token } = request.headers;
    const { code, clientId, redirectUri, grantType } = request.body;
  
    await opencrvs.getOIDPUserInfo(
      {
        code,
        clientId,
        redirectUri,
        grantType,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  
    reply.code(200);
  };

const OIDP_USERINFO_ENDPOINT =
  env.NATIONAL_ID_OIDP_REST_URL &&
  new URL("oidc/userinfo", env.NATIONAL_ID_OIDP_REST_URL).toString();

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
    `/Location?${new URLSearchParams({ name, type: "ADMIN_STRUCTURE" })}`
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
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  const response = await request.text();
  const decodedResponse = decodeUserInfoResponse(response);

  logger.info(`OIDP user info response: ${JSON.stringify(decodedResponse)}`);

  return pickUserInfo(decodedResponse);
};
