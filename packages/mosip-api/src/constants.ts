import { cleanEnv, str, port, url } from "envalid";
import { join } from "node:path";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  LOCALE: str({ devDefault: "en" }),
  SQLITE_DATABASE_PATH: str({
    devDefault: join(__dirname, "../../../data/sqlite/mosip-api.db"),
    // A good production default, but needs a Docker volume
    // default: "/data/sqlite/mosip-api.db",
    desc: "Path to the SQLite database used to store a OpenCRVS record-only token with the MOSIP transaction ID. Note that you need to add a volume to the Docker container to persist the data.",
  }),
  TRANSACTION_ID_PREFIX: str({
    default: "10001",
    desc: "Used to prefix the numeric transaction ID (1000101234567890) that is sent to MOSIP and received back",
  }),
  CLIENT_APP_URL: url({ devDefault: "http://localhost:3000" }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),
  OPENCRVS_PUBLIC_KEY_URL: str({
    devDefault: "http://localhost:4040/.well-known",
    desc: "OpenCRVS public key URL. Used to verify JWT authenticity",
  }),

  // MOSIP Birth & Death packets
  MOSIP_DEATH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs/death",
    desc: "The URL where MOSIP receives death webhooks from OpenCRVS",
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

  // MOSIP packet manager details
  MOSIP_AUTH_URL: str({
    devDefault:
      "http://localhost:20240/v1/authmanager/authenticate/clientidsecretkey",
  }),
  MOSIP_AUTH_CLIENT_ID: str({ devDefault: "mosip-regproc-client" }),
  MOSIP_AUTH_CLIENT_SECRET: str({ devDefault: "abcdeABCDE123456" }),
  MOSIP_CREATE_PACKET_URL: str({
    devDefault: "http://localhost:20240/commons/v1/packetmanager/createPacket",
  }),
  MOSIP_PROCESS_PACKET_URL: str({
    devDefault:
      "http://localhost:20240/registrationprocessor/v1/workflowmanager/workflowinstance",
  }),
});
