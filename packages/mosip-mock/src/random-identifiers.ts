import * as crypto from "crypto";

export const createNid = async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  const hash = crypto.createHash("sha256");
  return `NID-${hash.digest("hex").substring(0, 12).toUpperCase()}`;
};

export const createAid = () => {
  const hash = crypto.createHash("sha256");
  return `AID-${hash.digest("hex").substring(0, 12).toUpperCase()}`;
};
