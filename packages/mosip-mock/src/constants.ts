import { cleanEnv, port, str } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 20240 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  OPENCRVS_MOSIP_SERVER_URL: str({
    devDefault: "http://localhost:2024/webhooks/mosip",
    desc: "The URL where @opencrvs/mosip/server receives webhooks from MOSIP",
  }),
});
