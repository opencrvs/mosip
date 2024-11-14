import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  OPENCRVS_MOSIP_SERVER_URL: str({
    devDefault: "http://localhost:2024/webhooks/mosip",
    desc: "The URL where @opencrvs/mosip/server receives webhooks from MOSIP",
  }),
});
