import { cleanEnv, str, num } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: num({ default: 2024 }),
  MOSIP_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs",
    desc: "The URL where MOSIP receives webhooks from OpenCRVS",
  }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),
});
