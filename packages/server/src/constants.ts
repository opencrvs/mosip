import { cleanEnv, str, port } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  MOSIP_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs",
    desc: "The URL where MOSIP receives webhooks from OpenCRVS",
  }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),
});
