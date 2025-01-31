export const padBase64 = (str: string) =>
  str + "=".repeat((4 - (str.length % 4)) % 4);

export const base64Encode = (input: string) =>
  Buffer.from(input, "utf8").toString("base64url");
