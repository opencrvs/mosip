import { bool, cleanEnv, email, port, str } from "envalid";

export const env = cleanEnv(process.env, {
    PORT: port({ default: 3000 }),
    HOST: str({ default: "0.0.0.0", devDefault: "localhost" })
  });