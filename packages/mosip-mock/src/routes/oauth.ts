import { RouteHandlerMethod } from "fastify";

/** Mocks the OAuth2 response from MOSIP */
export const oauthHandler: RouteHandlerMethod = async (_, reply) => {
  return reply.status(200).send({
    access_token: "mock-access-token",
    token_type: "Bearer",
    expires_in: 3600,
  });
};
