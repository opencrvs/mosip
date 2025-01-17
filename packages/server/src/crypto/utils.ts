export const urlsafeBase64Encode = (input: Buffer, lineLength = 76) => {
  const base64 = input.toString("base64url");
  return (
    (base64
      .match(new RegExp(`.{1,${lineLength}}`, "g")) // Split into chunks
      ?.join("\n") || "") + "\n"
  );
};
