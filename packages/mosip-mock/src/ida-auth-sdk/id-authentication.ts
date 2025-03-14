import { RouteHandlerMethod } from "fastify";
import identities from "../mock-identities.json" assert { type: "json" };
import { validate } from "./validate";
import { decryptAuthData } from "./crypto";
import { DECRYPT_IDA_AUTH_PRIVATE_KEY } from "../constants";

export const idAuthenticationHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  const {
    individualId,
    transactionID,
    request: requestBody,
    requestSessionKey,
  } = request.body as {
    transactionID: string;
    individualId: string;
    individualIdType: "UIN" | "VID";
    request: string;
    requestSessionKey: string;
  };

  const authParams = decryptAuthData(
    requestBody,
    requestSessionKey,
    DECRYPT_IDA_AUTH_PRIVATE_KEY,
  );

  const payloadErrors = validate(authParams);
  if (payloadErrors.length > 0) {
    return reply.status(400).send({
      transactionID,
      version: "1.0",
      id: "mosip.identity.auth",
      errors: payloadErrors,
      responseTime: new Date().toISOString(),
      response: { authStatus: false, authToken: null },
    });
  }

  if (identities.some(({ nid }) => nid === individualId)) {
    return reply.status(200).send({
      responseTime: new Date().toISOString(),
      response: {
        authStatus: true,
        authToken: new Array({ length: 36 })
          .map(() => Math.floor(Math.random() * 10))
          .join(""),
      },
    });
  }

  return reply.status(200).send({
    transactionID,
    version: "1.0",
    id: "mosip.identity.auth",
    errors: [
      {
        errorCode: "IDA-MLC-002",
        errorMessage: "Invalid UIN",
        actionMessage: "Please retry with the correct UIN",
      },
    ],
    responseTime: new Date().toISOString(),
    response: { authStatus: false, authToken: null },
  });
};
