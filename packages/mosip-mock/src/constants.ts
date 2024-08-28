import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  OPENCRVS_MOSIP_GATEWAY_URL: str({
    devDefault: "http://localhost:2024/webhooks/mosip",
  }),
});
