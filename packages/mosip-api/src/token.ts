import * as jwt from "jsonwebtoken";

export const getRecordId = (token: string) => {
  const { recordId } = jwt.decode(token) as { recordId: string };
  return recordId;
};
