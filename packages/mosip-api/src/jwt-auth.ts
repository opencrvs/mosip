import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify";
import { env } from "./constants";

/** Fetches the public key from OpenCRVS to be able to verify JWTs */
export const getPublicKey = async (): Promise<string> => {
  try {
    const response = await fetch(env.OPENCRVS_PUBLIC_KEY_URL);
    return response.text();
  } catch (error) {
    console.error(
      `🔑  Failed to fetch public key from Core. Make sure Core is running, and you are able to connect to ${env.OPENCRVS_PUBLIC_KEY_URL}`,
    );
    if (env.isProd) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return getPublicKey();
  }
};

export function withAuthentication<T extends FastifyRequest>(
  handler: (request: T, reply: FastifyReply) => Promise<unknown>,
): (request: T, reply: FastifyReply) => Promise<unknown> {
  return async function (
    this: FastifyInstance,
    request: T,
    reply: FastifyReply,
  ) {
    try {
      await request.jwtVerify();
      return handler.call(this, request, reply); // Ensure `this` context is maintained
    } catch (err) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  };
}
