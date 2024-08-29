import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export const register = async (app: FastifyInstance) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "OpenCRVS-MOSIP Gateway",
        description: "Serves as a gateway between OpenCRVS and MOSIP",
        version: "1.0.0",
      },
      servers: [],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(fastifySwaggerUI);
};
