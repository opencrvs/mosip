import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { EMAIL_ENABLED, env } from "./constants";
import { opencrvsBirthHandler } from "./routes/opencrvs-birth";
import { deactivateNidHandler } from "./routes/deactivate-nid";
import { idAuthenticationHandler } from "./ida-auth-sdk/id-authentication";
import { webSubHubHandler } from "./routes/websub-hub";
import { packetManagerAuthHandler } from "./routes/packet-manager-auth";

const app = Fastify();

app.register(formbody);

app.post("/webhooks/opencrvs/birth", { handler: opencrvsBirthHandler });
app.post("/webhooks/opencrvs/death", { handler: deactivateNidHandler });
app.post("/idauthentication/v1/auth/:mispLk/:partnerId/:apiKey", {
  handler: idAuthenticationHandler,
});

/**
 * MOSIP WebSub hub
 */
app.post("/websub/hub", { handler: webSubHubHandler });

/*
 * MOSIP packet manager
 */
app.post("/v1/authmanager/authenticate/clientidsecretkey", {
  handler: packetManagerAuthHandler,
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
