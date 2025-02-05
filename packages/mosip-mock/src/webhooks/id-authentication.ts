import { RouteHandlerMethod } from "fastify";

export const idAuthenticationHandler: RouteHandlerMethod = async (
  _request,
  reply,
) => {
  return reply.status(200).send({
    responseTime: new Date().toISOString(),
    response: {
      authStatus: true,
      authToken: new Array({ length: 36 })
        .map(() => Math.floor(Math.random() * 10))
        .join(""),
    },
  });
};
