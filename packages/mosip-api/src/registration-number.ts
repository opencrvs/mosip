import { env } from "./constants";

export const generateRegistrationNumber = (trackingId: string) => {
  const currentYear = new Date().getFullYear().toString();
  return `${currentYear}${trackingId}`;
};

export const generateTransactionId = (prefix = env.TRANSACTION_ID_PREFIX) => {
  return `${prefix}${Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("")}`;
};
