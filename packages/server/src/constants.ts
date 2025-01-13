import { cleanEnv, str, port, url } from "envalid";
import { readFileSync } from 'fs';
import { join } from 'path';

export const KEY_SPLITTER = '#KEY_SPLITTER#'
export const VERSION_RSA_2048 = 'VER_R2'
export const SYMMETRIC_ALGORITHM = 'AES-GCM'
export const ASYMMETRIC_ALGORITHM = 'RSA-OAEP'
export const SYMMETRIC_KEY_SIZE: number = 32
export const NONCE_SIZE: number = 12
export const AAD_SIZE: number = 32
export const GCM_TAG_LENGTH: number = 16
export const THUMBPRINT_LENGTH: number = 32

export const env = cleanEnv(process.env, {
  PORT: port({ default: 2024 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  LOCALE: str({ devDefault: "en" }),
  MOSIP_BIRTH_PROXY_CALLBACK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs/birth",
    desc: "The URL where MOSIP receives birth webhooks from OpenCRVS",
  }),
  MOSIP_DEATH_PROXY_CALLBACK_URL: str({
    devDefault: "http://localhost:20240/webhooks/opencrvs/death",
    desc: "The URL where MOSIP receives death webhooks from OpenCRVS",
  }),
  OPENCRVS_GRAPHQL_GATEWAY_URL: str({
    devDefault: "http://localhost:7070/graphql",
    desc: "The URL of the OpenCRVS GraphQL Gateway",
  }),
  GATEWAY_URL: url({ devDefault: "http://localhost:7070" }),
  NATIONAL_ID_OIDP_REST_URL: url({ devDefault: "http://localhost:20260/" }),
  OIDP_REST_URL: url({ devDefault: "http://localhost:20260/" }),
  OIDP_JWT_AUD_CLAIM: str({ devDefault: '' }),
  MOSIP_AUTH_URL: str({ devDefault: '' }),
  MOSIP_AUTH_CLIENT_ID: str({ devDefault: '' }),
  MOSIP_AUTH_CLIENT_SECRET: str({ devDefault: '' }),
  MOSIP_AUTH_USER: str({ devDefault: '' }),
  MOSIP_AUTH_PASS: str({ devDefault: '' }),
  MOSIP_GENERATE_AID_URL: str({ devDefault: '' }),
  MOSIP_PUBLIC_KEY: str({ devDefault: '' }),
  OPENCRVS_PRIV_KEY: str({ devDefault: '' }),
  IS_THUMBRPINT: str({ devDefault: 'false' }),
  OIDP_CLIENT_PRIVATE_KEY: str({ devDefault:  readFileSync(join(__dirname, './dev-secrets/jwk.txt')).toString() }),
  });
