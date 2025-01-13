import Fastify from "fastify";
import { EMAIL_ENABLED, env } from "./constants";
import { opencrvsBirthHandler } from "./webhooks/opencrvs-birth";
import { deactivateNidHandler } from "./webhooks/deactivate-nid";

const app = Fastify();

app.post("/routes/opencrvs/birth", { handler: opencrvsBirthHandler });
app.post("/routes/opencrvs/death", { handler: deactivateNidHandler });

async function run() {
  if (env.isProd) {
    console.error(
      "⚠️ You are running MOCK national ID server in production. All identifiers will be logged. ⚠️"
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
