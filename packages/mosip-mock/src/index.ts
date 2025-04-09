import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { EMAIL_ENABLED, env, PRIVATE_KEY } from "./constants";
import { packetManagerCreateHandler } from "./routes/packet-manager-create";
import { packetManagerProcessHandler } from "./routes/packet-manager-process";
import { deactivateNidHandler } from "./routes/deactivate-nid";
import { idAuthenticationHandler } from "./ida-auth-sdk/id-authentication";
import { webSubHubHandler } from "./websub/websub-hub";
import { packetManagerAuthHandler } from "./routes/packet-manager-auth";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { VERIFICATION_METHOD } from "./verifiable-credentials/issue";

const app = Fastify();

app.register(formbody);

app.post("/webhooks/opencrvs/death", { handler: deactivateNidHandler });
app.post("/idauthentication/v1/auth/:mispLk/:partnerId/:apiKey", {
  handler: idAuthenticationHandler,
});
app.get("/.well-known/public-key.json", (_, reply) => {
  const privateKey = createPrivateKey(PRIVATE_KEY);
  const publicKey = createPublicKey(privateKey);

  const publicKeyPem = publicKey
    .export({ format: "pem", type: "spki" })
    .toString();

  const publicKeyJson = {
    "@context": "https://w3id.org/security#",
    id: env.ISSUER_URL,
    publicKey: [
      {
        id: VERIFICATION_METHOD,
        type: "RsaVerificationKey2018",
        controller: env.ISSUER_URL,
        publicKeyPem,
      },
    ],
    assertionMethod: [VERIFICATION_METHOD],
  };
  reply.send(publicKeyJson);
});

/**
 * MOSIP WebSub hub
 */
app.post("/websub/hub", { handler: webSubHubHandler });
app.post("/v1/authmanager/authenticate/clientidsecretkey", {
  handler: packetManagerAuthHandler,
});
app.put("/commons/v1/packetmanager/createPacket", {
  handler: packetManagerCreateHandler,
});
app.post("/registrationprocessor/v1/workflowmanager/workflowinstance", {
  handler: packetManagerProcessHandler,
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
