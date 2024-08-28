/** Database for storing the one-time tokens for OpenCRVS */
const database: Record<string, any> = {};

export const write = (key: string, value: any) => {
  database[key] = value;
};

export const read = (key: string) => {
  return database[key];
};

export const remove = (key: string) => {
  delete database[key];
};
