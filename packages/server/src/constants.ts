import { cleanEnv, str, num } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: num({ default: 2024 }),
  MOSIP_RECEIVE_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs",
  }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
  }),
});
