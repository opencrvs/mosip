import Fastify from "fastify";
import { EMAIL_ENABLED, env } from "./constants";
import { opencrvsBirthHandler } from "./webhooks/opencrvs-birth";
import { deactivateNidHandler } from "./webhooks/deactivate-nid";
import { idAuthenticationHandler } from "./ida-auth-sdk/id-authentication";

const app = Fastify();

app.post("/webhooks/opencrvs/birth", { handler: opencrvsBirthHandler });
app.post("/webhooks/opencrvs/death", { handler: deactivateNidHandler });
app.post("/idauthentication/v1/auth/:mispLk/:partnerId/:apiKey", {
  handler: idAuthenticationHandler,
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
