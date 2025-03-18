import { RouteHandlerMethod } from "fastify";

export const packetManagerAuthHandler: RouteHandlerMethod = async (
  request,
  reply,
) => {
  return reply
    .status(200)
    .send({ todo: "TODO: Figure out the response from Bevolv" });
};
