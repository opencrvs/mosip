import { bool, cleanEnv, email, port, str } from "envalid";
import { join } from "node:path";
import fs from "node:fs";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 20240 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  OPENCRVS_MOSIP_API_URL: str({
    devDefault: "http://localhost:2024/webhooks/mosip",
    desc: "The URL where @opencrvs/mosip/mosip-api receives webhooks from MOSIP",
  }),

  SENDER_EMAIL_ADDRESS: email({
    default: "noreply@opencrvs.org",
    desc: "The email address that will be used to send emails such as mock NID card and NID (de)activation.",
  }),
  ALERT_EMAIL: str({
    devDefault: undefined,
    desc: "The email address that will be used to send alert emails.",
  }),
  SMTP_HOST: str({
    devDefault: undefined,
    desc: "The SMTP host. The email details are used to send emails such as mock NID card and NID (de)activation.",
  }),
  SMTP_PORT: port({ devDefault: undefined }),
  SMTP_USERNAME: str({ devDefault: undefined }),
  SMTP_PASSWORD: str({ devDefault: undefined }),
  SMTP_SECURE: bool({ devDefault: false }),
  DECRYPT_IDA_AUTH_PRIVATE_KEY_PATH: str({
    default: join(__dirname, "./mock-only-ida-partner.pem"),
  }),
});

export const DECRYPT_IDA_AUTH_PRIVATE_KEY = fs
  .readFileSync(env.DECRYPT_IDA_AUTH_PRIVATE_KEY_PATH)
  .toString();

export const EMAIL_ENABLED = Boolean(env.SMTP_HOST);
