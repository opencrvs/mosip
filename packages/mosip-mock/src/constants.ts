import { bool, cleanEnv, email, port, str } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 20240 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  OPENCRVS_MOSIP_SERVER_URL: str({
    devDefault: "http://localhost:2024/webhooks/mosip",
    desc: "The URL where @opencrvs/mosip/server receives webhooks from MOSIP",
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
});

export const EMAIL_ENABLED = Boolean(env.SMTP_HOST);
