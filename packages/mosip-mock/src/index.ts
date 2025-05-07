import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { EMAIL_ENABLED, env, PRIVATE_KEY } from "./constants";
import { packetManagerCreateHandler } from "./routes/packet-manager-create";
import { packetManagerProcessHandler } from "./routes/packet-manager-process";
import { idAuthenticationHandler } from "./ida-auth-sdk/id-authentication";
import { webSubHubHandler } from "./websub/websub-hub";
import { packetManagerAuthHandler } from "./routes/packet-manager-auth";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { PUBLIC_KEY_URL } from "./verifiable-credentials/issue";

const app = Fastify();

app.register(formbody);

app.post("/idauthentication/v1/auth/:mispLk/:partnerId/:apiKey", {
  handler: idAuthenticationHandler,
});
app.get("/.well-known/public-key.json", (_, reply) => {
  const privateKey = createPrivateKey(PRIVATE_KEY);
  const publicKey = createPublicKey(privateKey);

  // const publicKeyPem = publicKey
  //   .export({ format: "pem", type: "spki" })
  //   .toString();

  const publicKeyJson = {
    "@context": "https://w3id.org/security/v2",
    type: "RsaVerificationKey2018",
    id: PUBLIC_KEY_URL,
    controller: `${env.ISSUER_URL}/.well-known/controller.json`,
    publicKeyPem:
      "-----BEGIN PUBLIC KEY-----\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw34EhsyQFAbB+jideCNO\r\n2HXAMQDR4NnwsVNQVcV8OxieMhi1pSreJZ8dt/MsgmdI3AW53WQ4ltXiZwdQ1Q/L\r\nm2t2kzFNAY57o8KG/V9sQIc5/oKH+G2y3+gotR+TaWxAg3RvSPG6X2KMSpKA4UB4\r\n+JVuqQNNZLdzGwVCf5+SMvjiamOX5xRnyyjhPJGKloykOIfmKaDRrXmV5QX5Lapk\r\nmy0GoAWIB96JpznDOFQlRMVGMKXr2crlxeHPBjiEm70ZnFpIGaacxCaFnuxWcCeb\r\nIoPufZaF7CkwVoSfKNltztsAgQkDUKO/kZ3hlxjj6do1f35Ow8mxU/RnSrq3mgFW\r\nWQIDAQAB\r\n-----END PUBLIC KEY-----",
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
