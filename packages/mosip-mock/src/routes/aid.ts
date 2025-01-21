import { RouteHandlerMethod } from "fastify";
import { createAid } from "../random-identifiers";

export const aidHandler: RouteHandlerMethod = async (request, reply) => {
  return reply.status(200).send(createAid());
};
