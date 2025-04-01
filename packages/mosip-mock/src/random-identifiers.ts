import * as crypto from "crypto";

export const createNid = async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  return Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join(
    "",
  );
};

export const createAid = () => {
  const hash = crypto.createHash("sha256");
  return `AID-${hash.digest("hex").substring(0, 12).toUpperCase()}`;
};
