import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  OPENCRVS_CLIENT_ID: str(),
  OPENCRVS_CLIENT_SECRET: str(),
  OPENCRVS_SHA_SECRET: str(),
  OPENCRVS_TOKEN_URL: str(),
  OPENCRVS_WEBHOOK_SUBSCRIBE_URL: str(),
  OPENCRVS_WEBHOOK_CALLBACK_URL: str({
    default: "http://mosip-api:2024/opencrvs-callback",
    devDefault: "http://localhost:2024/opencrvs-callback",
  }),
});
