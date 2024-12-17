import Fastify from "fastify";
import { env } from "./constants";
import jwt from "jsonwebtoken";

const app = Fastify({ logger: true });

const tokenRequestSchema = {
  body: {
    type: "object",
    required: ["code", "client_id", "redirect_uri", "grant_type"],
    properties: {
      code: { type: "string" },
      client_id: { type: "string" },
      redirect_uri: { type: "string" },
      grant_type: { type: "string" },
    },
  },
};

// TODO: serve this HTML on a new route in order to fake the E-Signet redirect: src/mock-authorizer/index.html from this pull request: https://github.com/opencrvs/opencrvs-farajaland/pull/1180/files#diff-ec12450d106120c6c0ba589558d4fd0acf224a65b788547a8791a8c5a40dd560
// TODO: The route is called /authorize
// TODO: Validate the search params: https://github.com/opencrvs/mosip/blob/8e9c98b29b43a25561c8b9a0d6ae9ae4136adfe8/packages/country-config/src/forms.ts#L12 and return the correct state


// TODO: mock: /oidc/userinfo
/*
Should return an object like this in a JWT
Which is decoded appropriatly by the decodeUserInfoResponse function in esignet-api.ts https://github.com/opencrvs/mosip/blob/fe72e50d4236d559ada66c4a8f6cf34e1b9ce9cd/packages/server/src/esignet-api.ts#L159

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
*/

app.post("/oauth/token", {
//   schema: tokenRequestSchema,
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
