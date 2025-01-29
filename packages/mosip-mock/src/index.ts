import Fastify from "fastify";
import { EMAIL_ENABLED, env } from "./constants";
import { birthHandler } from "./routes/birth";
import { deactivateNidHandler } from "./routes/deactivate-nid";
import { aidHandler } from "./routes/aid";
import { oauthHandler } from "./routes/oauth";
import formbody from "@fastify/formbody";

const app = Fastify();

// MOSIP's auth endpoint uses application/x-www-form-urlencoded so for simplicity we'll use this plugin
app.register(formbody);

app.post("/events/birth", { handler: birthHandler });
app.post("/events/death", { handler: deactivateNidHandler });
app.post("/oauth/token", { handler: oauthHandler });
app.get("/aid", { handler: aidHandler });

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
