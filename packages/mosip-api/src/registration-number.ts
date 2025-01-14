export const generateRegistrationNumber = (trackingId: string) => {
  const currentYear = new Date().getFullYear().toString();
  return `${currentYear}${trackingId}`;
};
