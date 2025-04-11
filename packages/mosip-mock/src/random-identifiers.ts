export const createNid = async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
    "",
  );
};
