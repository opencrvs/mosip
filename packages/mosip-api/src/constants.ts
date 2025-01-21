import { cleanEnv, str, port, url } from "envalid";
import { readFileSync } from "fs";
import { join } from "path";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  LOCALE: str({ devDefault: "en" }),
  MOSIP_BIRTH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs/birth",
    desc: "The URL where MOSIP receives birth webhooks from OpenCRVS",
  }),
  MOSIP_DEATH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs/death",
    desc: "The URL where MOSIP receives death webhooks from OpenCRVS",
  }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),
  ESIGNET_USERINFO_URL: url({
    devDefault: "http://localhost:20260/oidc/userinfo",
  }),
  ESIGNET_TOKEN_URL: url({ devDefault: "http://localhost:20260/oauth/token" }),
  OIDP_JWT_AUD_CLAIM: str({ devDefault: undefined }),
  OIDP_CLIENT_PRIVATE_KEY: str({
    devDefault: readFileSync(
      join(__dirname, "./dev-secrets/jwk.txt"),
    ).toString(),
  }),
});
