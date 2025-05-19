import { FastifyReply, FastifyRequest } from "fastify";
import {
  OIDPQuerySchema,
  OIDPUserInfoSchema,
  fetchToken,
  fetchUserInfo,
} from "../esignet-api";
import { z } from "zod";

export type OIDPUserInfoRequest = FastifyRequest<{
  Body: z.infer<typeof OIDPUserInfoSchema>;
  Querystring: z.infer<typeof OIDPQuerySchema>;
}>;

export const OIDPUserInfoHandler = async (
  request: OIDPUserInfoRequest,
  _reply: FastifyReply,
) => {
  const { clientId, redirectUri } = request.body;
  const code = request.query.code;

  console.log("OIDPUserInfoHandler", {
    clientId,
    redirectUri,
    code,
  });

  const tokenResponse = await fetchToken({
    code,
    clientId,
    redirectUri,
  });

  if (!tokenResponse.access_token) {
    throw new Error(
      "Something went wrong with the OIDP token request. No access token was returned. Response from OIDP: " +
        JSON.stringify(tokenResponse),
    );
  }

  return fetchUserInfo(tokenResponse.access_token);
};
