import { cleanEnv, str, port, url, bool } from "envalid";
import { readFileSync } from "fs";
import { join } from "path";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  LOCALE: str({ devDefault: "en" }),
  MOSIP_BIRTH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/events/birth",
    desc: "The URL where MOSIP receives birth webhooks from OpenCRVS",
  }),
  MOSIP_DEATH_WEBHOOK_URL: str({
    devDefault: "http://localhost:20240/events/death",
    desc: "The URL where MOSIP receives death webhooks from OpenCRVS",
  }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),
  ESIGNET_USERINFO_URL: url({
    devDefault: "http://localhost:20260/oidc/userinfo",
  }),
  ESIGNET_TOKEN_URL: url({ devDefault: "http://localhost:20260/oauth/token" }),
  OIDP_JWT_AUD_CLAIM: str({ devDefault: undefined }),
  OIDP_CLIENT_PRIVATE_KEY: str({
    devDefault: readFileSync(
      join(__dirname, "../../../config/jwk.txt"),
    ).toString(),
  }),
  MOSIP_AUTH_URL: str({ devDefault: "http://localhost:20240/oauth/token" }),
  MOSIP_AUTH_CLIENT_ID: str({ devDefault: "mosip-mock" }),
  MOSIP_AUTH_CLIENT_SECRET: str({ devDefault: "mosip-mock" }),
  MOSIP_AUTH_USER: str({ devDefault: "mosip-mock" }),
  MOSIP_AUTH_PASS: str({ devDefault: "mosip-mock" }),
  MOSIP_GENERATE_AID_URL: str({ devDefault: "http://localhost:20240/aid" }),

  PKCS12_FILE_PATH: str({
    devDefault: join(__dirname, "../../../config/keystore.p12"),
  }),
  PKCS12_PASSWORD: str({ devDefault: "mosip123" }),

  MOSIP_CERTIFICATE: str({
    // NOTE! Generated in dev from `./dev-secrets/mosip-private-key.pem`, if needed for future.
    // In reality, the private key would never be shared with OpenCRVS
    devDefault: readFileSync(
      join(__dirname, "../../../config/mosip-certificate.pem"),
    ).toString(),
    desc: "Used to encrypt the symmetric key that MOSIP can use to decrypt the payload.",
  }),

  DANGEROUSLY_BYPASS_ENCRYPTION: bool({
    default: false,
    desc: "DO _NOT_ USE IN PRODUCTION",
  }),
});
