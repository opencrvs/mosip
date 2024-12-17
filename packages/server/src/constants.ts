import { cleanEnv, str, port, url } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
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
  GATEWAY_URL: url({ default: "http://localhost:7070" }),
  NATIONAL_ID_OIDP_REST_URL: url({ default: undefined }),
  OIDP_REST_URL: url({ default: "http://localhost:20260/" }),
  OIDP_JWT_AUD_CLAIM: str({ default: undefined }),
  OIDP_CLIENT_PRIVATE_KEY: str({ default: "mock-secret" }),
});