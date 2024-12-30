import { cleanEnv, str, port, url, num } from "envalid";

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
  NATIONAL_ID_OIDP_REST_URL: url({ default: "http://localhost:20260/" }),
  OIDP_REST_URL: url({ default: "http://localhost:20260/" }),
  CERT_PRIVATE_KEY_PATH: str({ devDefault: ".secrets/private-key.pem" }),
  CONFIG_TOKEN_EXPIRY_SECONDS: num({ default: 604800 }), // 1 week
  CONFIG_SYSTEM_TOKEN_EXPIRY_SECONDS: num({ default: 600 }), // 10 minutes
});
