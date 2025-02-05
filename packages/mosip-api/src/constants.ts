import { cleanEnv, str, port, url } from "envalid";
import { readFileSync } from "fs";
import { join } from "path";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  LOCALE: str({ devDefault: "en" }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),

  // MOSIP Birth & Death packets
  MOSIP_BIRTH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs/birth",
    desc: "The URL where MOSIP receives birth webhooks from OpenCRVS",
  }),
  MOSIP_DEATH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs/death",
    desc: "The URL where MOSIP receives death webhooks from OpenCRVS",
  }),

  // E-Signet
  ESIGNET_USERINFO_URL: url({
    devDefault: "http://localhost:20260/oidc/userinfo",
  }),
  ESIGNET_TOKEN_URL: url({ devDefault: "http://localhost:20260/oauth/token" }),
  OIDP_JWT_AUD_CLAIM: str({ devDefault: undefined }),
  OIDP_CLIENT_PRIVATE_KEY: str({
    devDefault: readFileSync(
      join(__dirname, "./dev-secrets/jwk.txt"),
    ).toString(),
  }),

  // NOTE: Following files and credentials are generally created by MOSIP and their assistance.
  // MOSIP Auth
  PARTNER_APIKEY: str({ devDefault: "123456" }),
  PARTNER_MISP_LK: str({
    devDefault: "aaaaaAAAAAbbbbbBBBBBcccccCCCCCdddddDDDDD",
  }),
  PARTNER_ID: str({ devDefault: "crvs-partner" }),

  // MOSIP IDA auth server
  IDA_AUTH_DOMAIN_URI: str({ devDefault: "http://localhost:20240" }),
  IDA_AUTH_URL: str({
    devDefault: "http://localhost:20240/idauthentication/v1/auth",
  }),

  // MOSIP Crypto encrypt
  ENCRYPT_CERT_PATH: str({ devDefault: "../../certs/ida-partner.crt" }),
  DECRYPT_P12_FILE_PATH: str({ devDefault: "../../certs/keystore.p12" }),
  DECRYPT_P12_FILE_PASSWORD: str({ devDefault: "password-123" }),

  // MOSIP Crypto signature
  SIGN_P12_FILE_PATH: str({ devDefault: "../../certs/keystore.p12" }),
  SIGN_P12_FILE_PASSWORD: str({ devDefault: "password-123" }),
});
