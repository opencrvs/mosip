import Fastify, { FastifyError, FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import {
  registrationEventHandler,
  opencrvsRecordSchema,
} from "./routes/event-registration";
import { env } from "./constants";
import * as openapi from "./openapi-documentation";
import { OIDPUserInfoSchema, OIDPQuerySchema } from "./esignet-api";
import formbody from "@fastify/formbody";
import { reviewEventHandler } from "./routes/event-review";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { getPublicKey } from "./opencrvs-api";
import { OIDPUserInfoHandler } from "./routes/oidp-user-info";
import { initSqlite } from "./database";
import {
  credentialIssuedHandler,
  CredentialIssuedSchema,
} from "./routes/websub-credential-issued";
import { initWebSub } from "./websub/subscribe";

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
};

const initRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/events/registration",
    method: "POST",
    handler: registrationEventHandler,
    schema: {
      body: opencrvsRecordSchema,
    },
  });
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/events/review",
    method: "POST",
    handler: reviewEventHandler,
    schema: {
      body: opencrvsRecordSchema,
    },
  });

  /*
   * E-Signet
   */
  app.withTypeProvider<ZodTypeProvider>().route({
    url: "/esignet/get-oidp-user-info",
    method: "POST",
    handler: OIDPUserInfoHandler,
    schema: {
      body: OIDPUserInfoSchema,
      querystring: OIDPQuerySchema,
    },
  });

  /**
   * MOSIP Kafka WebSub
   */
  app.get("/websub/callback", async (request, reply) => {
    const { "hub.challenge": challenge } = request.query as {
      "hub.challenge"?: string;
    };
    if (challenge) return reply.type("text/plain").send(challenge);
    else return reply.code(400).send("Missing hub.challenge");
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/websub/callback", // see constants.ts `${env.MOSIP_WEBSUB_CALLBACK_URL}`
    handler: credentialIssuedHandler,
    schema: {
      body: CredentialIssuedSchema,
    },
  });
};

let corePublicKey: string;
let publicKeyUpdatedAt = Date.now();
const getCorePublicKey = async () => {
  if (!corePublicKey) {
    corePublicKey = await getPublicKey();
  }

  return corePublicKey;
};

export const buildFastify = async () => {
  const app = Fastify({
    logger: envToLogger[env.isProd ? "production" : "development"],
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(formbody);
  app.register(cors, {
    origin: [env.CLIENT_APP_URL],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  openapi.register(app);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(500).send({ error: "An unexpected error occurred" });
  });

  app.register(jwt, {
    secret: { public: getCorePublicKey },
    verify: { algorithms: ["RS256"] },
  });

  app.addHook("onRequest", async (request, reply) => {
    // @NOTE This disables the JWT authentication for the MOSIP webhook
    // The route is open for requests, but the credential will be verified it's from MOSIP
    // This API should be allowed ONLY from the IP address of MOSIP on network / Traefik level
    if (request.routeOptions.url === "/websub/callback") return;

    try {
      await request.jwtVerify();
    } catch (err) {
      const error = err as FastifyError;

      const moreThanAMinuteSinceLastUpdate =
        Date.now() - publicKeyUpdatedAt > 60_000;

      if (
        error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID" &&
        moreThanAMinuteSinceLastUpdate
      ) {
        app.log.info("🔁 JWT failed, refreshing public key...");
        try {
          corePublicKey = await getPublicKey();
          publicKeyUpdatedAt = Date.now();
          await request.jwtVerify();
          return;
        } catch (retryErr) {
          app.log.error("🔐 JWT retry failed:", retryErr);
        }
      } else {
        app.log.error("🔐 JWT verify failed:", err);
      }

      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.after(() => initRoutes(app));

  return app;
};

async function run() {
  const app = await buildFastify();

  const { wasCreated, wasConnected, database } = initSqlite(
    env.SQLITE_DATABASE_PATH,
  );

  wasCreated && app.log.info("SQLite token storage created 🚀✅ ");
  wasConnected && app.log.info("SQLite token storage connected ✅");

  await app.ready();
  await app.listen({
    port: env.PORT,
    host: env.HOST,
    listenTextResolver: () =>
      `OpenCRVS-MOSIP API running at http://${env.HOST}:${env.PORT} ✅`,
  });
  app.log.info(
    `Swagger UI running at http://${env.HOST}:${env.PORT}/documentation ✅`,
  );

  const { topic } = await initWebSub();
  app.log.info(`WebSub subscription initialized for topic '${topic}' ✅`);

  process.on("exit", () => {
    database.close();
    app.close();
  });
}

// Only run daemon if it's executed directly - as in `tsx index.ts` for example
if (require.main === module) {
  void run();
}
