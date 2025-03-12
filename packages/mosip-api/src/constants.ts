import { cleanEnv, str, port, url } from "envalid";
import { join } from "node:path";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  LOCALE: str({ devDefault: "en" }),
  CLIENT_APP_URL: url({ devDefault: "http://localhost:3000" }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),

  // MOSIP Birth & Death packets
  MOSIP_BIRTH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/opencrvs/v1/birth",
    desc: "The URL where MOSIP receives birth packets from OpenCRVS",
  }),
  MOSIP_DEATH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/opencrvs/v1/death",
    desc: "The URL where MOSIP receives death packets from OpenCRVS",
  }),

  // E-Signet
  ESIGNET_USERINFO_URL: url({
    devDefault: "http://localhost:20260/oidc/userinfo",
  }),
  ESIGNET_TOKEN_URL: url({ devDefault: "http://localhost:20260/oauth/token" }),
  OPENID_PROVIDER_CLAIMS: str({ devDefault: undefined }),
  OIDP_CLIENT_PRIVATE_KEY_PATH: str({
    devDefault: join(__dirname, "../../../certs/esignet-jwk.txt"),
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
  ENCRYPT_CERT_PATH: str({
    devDefault: join(__dirname, "../../../certs/ida-partner.crt"),
  }),
  DECRYPT_P12_FILE_PATH: str({
    devDefault: join(__dirname, "../../../certs/keystore.p12"),
  }),
  DECRYPT_P12_FILE_PASSWORD: str({ devDefault: "mosip123" }),

  // MOSIP Crypto signature
  SIGN_P12_FILE_PATH: str({
    devDefault: join(__dirname, "../../../certs/keystore.p12"),
  }),
  SIGN_P12_FILE_PASSWORD: str({ devDefault: "mosip123" }),

  // MOSIP Java mediator details
  MOSIP_AUTH_URL: str({
    devDefault:
      "http://localhost:20240/auth/realms/mosip/protocol/openid-connect/token",
  }),
  MOSIP_AUTH_CLIENT_ID: str({ devDefault: "mosip-mock" }),
  MOSIP_AUTH_CLIENT_SECRET: str({ devDefault: "mosip-mock" }),
  MOSIP_AUTH_USER: str({ devDefault: "mosip-mock" }),
  MOSIP_AUTH_PASS: str({ devDefault: "mosip-mock" }),
  MOSIP_GENERATE_AID_URL: str({
    devDefault: "http://localhost:20240/generateAid",
  }),
  CREDENTIAL_PARTNER_PRIVATE_KEY_PATH: str({
    devDefault: join(__dirname, "../../../certs/credential-partner.pem"),
  }),
  CREDENTIAL_PARTNER_CERTIFICATE_PATH: str({
    devDefault: join(__dirname, "../../../certs/credential-partner.csr"),
  }),
});
