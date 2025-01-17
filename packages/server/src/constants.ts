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

  // MOSIP Auth
  PARTNER_APIKEY: str(),
  PARTNER_MISP_LK: str(),
  PARTNER_ID: str(),

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

  // E-Signet
  OIDP_REST_URL: url(),
  OIDP_JWT_AUD_CLAIM: str(),
  OIDP_CLIENT_PRIVATE_KEY_PATH: str(),
});

export const OIDP_CLIENT_PRIVATE_KEY = fs.readFileSync(
  join(__dirname, env.OIDP_CLIENT_PRIVATE_KEY_PATH),
  "utf8"
);
export const ENCRYPT_PEM_CERT = fs.readFileSync(
  join(__dirname, env.ENCRYPT_CERT_PATH),
  "utf8"
);
export const SIGN_P12_FILE = fs.readFileSync(
  join(__dirname, env.SIGN_P12_FILE_PATH),
  "utf8"
);

const SIGN_P12_FILE_CERTIFICATE_PEM_PATH = join(
  __dirname,
  env.SIGN_P12_FILE_PATH + ".certificate.pem"
);

const SIGN_P12_FILE_PRIVATE_KEY_PEM_PATH = join(
  __dirname,
  env.SIGN_P12_FILE_PATH + ".private-key.pem"
);

if (
  !fs.existsSync(SIGN_P12_FILE_CERTIFICATE_PEM_PATH) ||
  !fs.existsSync(SIGN_P12_FILE_PRIVATE_KEY_PEM_PATH)
) {
  throw new Error(
    `The certificate or private key file extracted from the PKCS12 file do not exist. Please run the following commands and try again:

openssl pkcs12 -in ${env.SIGN_P12_FILE_PATH} -clcerts -nokeys -passin pass:${env.SIGN_P12_FILE_PASSWORD} | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' > ${env.SIGN_P12_FILE_PATH}.certificate.pem
openssl pkcs12 -in ${env.SIGN_P12_FILE_PATH} -nocerts -nodes -passin pass:${env.SIGN_P12_FILE_PASSWORD} | sed -n '/-----BEGIN PRIVATE KEY-----/,/-----END PRIVATE KEY-----/p' > ${env.SIGN_P12_FILE_PATH}.private-key.pem`
  );
}

export const SIGN_P12_FILE_CERTIFICATE_PEM_FILE = fs.readFileSync(
  SIGN_P12_FILE_CERTIFICATE_PEM_PATH,
  "utf8"
);

export const SIGN_P12_FILE_PRIVATE_KEY_PEM_FILE = fs.readFileSync(
  SIGN_P12_FILE_PRIVATE_KEY_PEM_PATH,
  "utf8"
);
