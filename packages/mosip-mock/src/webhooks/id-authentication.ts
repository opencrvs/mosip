import { RouteHandlerMethod } from "fastify";
import identities from "../mock-identities.json" assert { type: "json" };
import { validate } from "./validate";

export const idAuthenticationHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  const { individualId, transactionID } = request.body as {
    transactionID: string;
    individualId: string;
    individualIdType: "UIN" | "VID";
  };

  const payloadErrors = validate(request.body as any);
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
