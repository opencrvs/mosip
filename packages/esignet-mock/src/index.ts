import Fastify from "fastify";
import { env } from "./constants";
import jwt from "jsonwebtoken";
import path from "path";
import fastifyStatic from "@fastify/static";
import formbody from "@fastify/formbody";
import * as jose from "jose";
import { readFileSync } from 'fs';
import { join } from 'path';

const app = Fastify({ logger: true });

const JWT_ALG = 'RS256'
const JWT_EXPIRATION_TIME = '1h'

const generateSignedJwt = async (userInfo: OIDPUserInfo) => {
  const header = {
    alg: JWT_ALG,
    typ: "JWT",
  };

  const decodeKey = Buffer.from(
    readFileSync(join(__dirname, './dev-secrets/jwk.txt')).toString(),
    "base64"
  )?.toString();
  const jwkObject = JSON.parse(decodeKey);
  const privateKey = await jose.importJWK(jwkObject, JWT_ALG);

  return new jose.SignJWT(userInfo)
    .setProtectedHeader(header)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .sign(privateKey);
};

app.register(fastifyStatic, {
  root: path.join(__dirname, "mock-authorizer"),
});
app.register(formbody);

const tokenRequestSchema = {
  body: {
    type: "object",
    required: ["code", "client_id", "redirect_uri", "grant_type"],
    properties: {
      code: { type: "string" },
      client_id: { type: "string" },
      redirect_uri: { type: "string" },
      grant_type: { type: "string" },
      client_assertion_type: { type: "string" },
      client_assertion: { type: "string" }
    },
  },
};

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

// TODO: mock: /oidc/userinfo
/*
Should return an object like this in a JWT
Which is decoded appropriatly by the decodeUserInfoResponse function in esignet-api.ts https://github.com/opencrvs/mosip/blob/fe72e50d4236d559ada66c4a8f6cf34e1b9ce9cd/packages/server/src/esignet-api.ts#L159
*/

app.post("/oidc/userinfo", {
  handler: async (request: any, reply) => {
    const userInfo: OIDPUserInfo = {
      sub: "405710304278395",
      name: "Niko",
      given_name: "Simon",
      family_name: "Bellic",
      middle_name: "Stern",
      nickname: "Nik",
      preferred_username: "niko",
      profile: "niko_bellic",
      picture: "fnoudgoag",
      website: "www.nikobellic.com",
      email: "nikobel@gmail.com",
      email_verified: true,
      gender: "male",
      birthdate: "15/05/1990",
      zoneinfo: "fsrthtst",
      locale: "en-US",
      phone_number: "0314412652",
      phone_number_verified: true,
      updated_at: Date.now(),
      address: {
        formatted: "221B Baker Street, Marylebone, London NW1 6XE, UK",
        street_address: "221B Baker Street",
        locality: "Marylebone",
        region: "London",
        postal_code: "NW1 6XE",
        city: "London",
        country: "United Kingdom",
      },
    };

    return reply.send(await generateSignedJwt(userInfo));
  },
});

// TODO: serve this HTML on a new route in order to fake the E-Signet redirect: src/mock-authorizer/index.html from this pull request: https://github.com/opencrvs/opencrvs-farajaland/pull/1180/files#diff-ec12450d106120c6c0ba589558d4fd0acf224a65b788547a8791a8c5a40dd560
// TODO: The route is called /authorize
// TODO: Validate the search params: https://github.com/opencrvs/mosip/blob/8e9c98b29b43a25561c8b9a0d6ae9ae4136adfe8/packages/country-config/src/forms.ts#L12 and return the correct state

const authorizeSchema = {
  querystring: {
    type: "object",
    required: ["client_id", "response_type", "scope", "acr_values", "claims"],
    properties: {
      client_id: { type: "string" },
      response_type: { type: "string" },
      scope: { type: "string" },
      acr_values: { type: "string" },
      claims: { type: "string" },
    },
  },
};

app.post("/authorize", {
  schema: authorizeSchema,
  handler: async (request: any, reply) => {
    const htmlFilePath = path.join(__dirname, './mock-authorizer/index.html');
    const html = readFileSync(htmlFilePath, 'utf-8');

    const modifiedHtml = html
      .replace(/{{CLIENT_URL}}/g, env.CLIENT_URL)
      .replace(/{{client_id}}/g, request.query.client_id)
      .replace(/{{response_type}}/g, request.query.response_type)
      .replace(/{{scope}}/g, request.query.scope)
      .replace(/{{acr_values}}/g, request.query.acr_values)
      .replace(/{{claims}}/g, request.query.claims)
      .replace(/{{state}}/g, request.query.state)

    return reply.type('text/html').send(modifiedHtml);
  },
});

app.post("/oauth/token", {
  schema: tokenRequestSchema,
  handler: async (request: any, reply) => {
    const payload = {
      code: request.body.code,
      client_id: request.body.client_id,
      redirect_uri: request.body.redirect_uri,
      grant_type: request.body.grant_type,
      client_assertion_type: request.body.client_assertion_type,
      client_assertion: request.body.client_assertion,
    };

    const accessToken = jwt.sign(payload, "mock-secret", {
      expiresIn: "1h",
    });

    return reply.send({
      access_token: accessToken,
      expires_in: "1h",
    });
  },
});

async function run() {
  await app.ready();
  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  console.log(`E-Signet mock server running at http://${env.HOST}:${env.PORT}`);
}

void run();
