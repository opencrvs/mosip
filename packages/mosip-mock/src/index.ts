import Fastify from "fastify";
import { EMAIL_ENABLED, env } from "./constants";
import { birthHandler } from "./routes/birth";
import { deactivateNidHandler } from "./routes/deactivate-nid";
import { aidHandler } from "./routes/aid";
import { idAuthenticationHandler } from "./routes/id-authentication";
import { oauthHandler } from "./routes/oauth";
import formbody from "@fastify/formbody";

const app = Fastify();

// MOSIP's auth endpoint uses application/x-www-form-urlencoded so for simplicity we'll use this plugin
app.register(formbody);

/*
 * MOSIP IDA Auth
 */
app.post("/idauthentication/v1/auth/:mispLk/:partnerId/:apiKey", {
  handler: idAuthenticationHandler,
});

/*
 * MOSIP IAM OAuth
 */
app.post("/auth/realms/mosip/protocol/openid-connect/token", {
  handler: oauthHandler,
});

/*
 * MOSIP Java Mediator
 */
app.get("/generateAid", { handler: aidHandler });
app.post("/opencrvs/v1/birth", { handler: birthHandler });
app.post("/opencrvs/v1/death", { handler: deactivateNidHandler });
app.post("/opencrvs/v1/update", {
  // @TODO: Correction not implemented yet in either MOSIP or OpenCRVS side
  handler: () => console.warn("Correction not implemented yet."),
});

async function run() {
  if (env.isProd) {
    console.error(
      "⚠️ You are running MOCK national ID server in production. All identifiers will be logged. ⚠️",
    );
  }

  await app.ready();
  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  const emailStatus = EMAIL_ENABLED
    ? "✅ Emails enabled"
    : "❌ Emails disabled";

  console.log(`MOSIP mock server running at http://${env.HOST}:${env.PORT}`);
  console.log(emailStatus);
}

void run();
