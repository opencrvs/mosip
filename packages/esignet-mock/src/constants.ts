import { cleanEnv, port, str, url } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 20260 }),
  HOST: str({ default: "0.0.0.0", devDefault: "localhost" }),
  CLIENT_URL: url({ devDefault: "http://localhost:3000" }),
  });