import { cleanEnv, str, port, url } from "envalid";
import fs from "fs";
import { join } from "path";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  LOCALE: str({ devDefault: "en" }),
  MOSIP_BIRTH_WEBHOOK_URL: str({
    desc: "The URL where MOSIP receives birth webhooks from OpenCRVS",
  }),
  MOSIP_DEATH_WEBHOOK_URL: str({
    desc: "The URL where MOSIP receives death webhooks from OpenCRVS",
  }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),
  GATEWAY_URL: url(),

  // E-Signet
  OIDP_REST_URL: url(),
  OIDP_JWT_AUD_CLAIM: str(),
  OIDP_CLIENT_PRIVATE_KEY_PATH: str(),

  // MOSIP Auth server
  IDA_AUTH_DOMAIN_URI: str(),
  IDA_AUTH_URL: str(),

  // Crypto encrypt
  ENCRYPT_CERT_PATH: str(),
  DECRYPT_P12_FILE_PATH: str(),
  DECRYPT_P12_FILE_PASSWORD: str(),

  // Crypto signature
  SIGN_P12_FILE_PATH: str(),
  SIGN_P12_FILE_PASSWORD: str(),
});

export const OIDP_CLIENT_PRIVATE_KEY = fs.readFileSync(
  join(__dirname, env.OIDP_CLIENT_PRIVATE_KEY_PATH),
  "utf8"
);
