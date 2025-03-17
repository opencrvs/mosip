import test from "node:test";
import assert from "node:assert";
import { buildFastify } from "..";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { env } from "../constants";
import incomingBirthBundleMother from "../../../../docs/example-events/incoming-birth-bundle.json";
import incomingBirthBundleMotherFather from "../../../../docs/example-events/incoming-birth-bundle-mother-father.json";
import incomingBirthBundleInformantMotherFather from "../../../../docs/example-events/incoming-birth-bundle-informant-mother-father.json";
import incomingBirthBundleDeceasedSpouse from "../../../../docs/example-events/incoming-death-bundle-deceased-spouse.json";

const mswServer = setupServer(
  http.get(env.OPENCRVS_PUBLIC_KEY_URL, () =>
    HttpResponse.text(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuAYLAh4YuRfMkH/VCwNS
pPUelpojcpEAUycsx8EEwMS/BzzqY1991CN5dljCw8WB7J9T7Buoql/ZxCC/lan8
4wFW7/msT0hvTswDuzzD62VSQ32uxe5SP4E1s3FjbqXroXC4gW5VVqopkvgdMbIo
fPoSxiheof7qyBJXiW84F0cKdwAjD39Q8fg66IrrzCjFjQTDbUTThXOj7+QxNlvP
KaFLoDDylIZBP2hM1Z0NkrY3C6BXLUp4D4qU9QbtMhD2qxz3zl39XbsE43rxu/Kp
VrVwQoDmo/yirzsNBCicXpjyj14X2L92YN7016r0oXRXEa6fPNiPQAvpqZea6l1T
CwIDAQAB
-----END PUBLIC KEY-----`),
  ),
  http.post(env.OPENCRVS_GRAPHQL_GATEWAY_URL, () =>
    HttpResponse.json({}, { status: 200 }),
  ),
);
mswServer.listen();

const VALID_JWT =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWNvcmQuZGVjbGFyZS1iaXJ0aCIsInJlY29yZC5kZWNsYXJlLWRlYXRoIiwicmVjb3JkLmRlY2xhcmUtbWFycmlhZ2UiLCJyZWNvcmQuZGVjbGFyYXRpb24tZWRpdCIsInJlY29yZC5kZWNsYXJhdGlvbi1zdWJtaXQtZm9yLXVwZGF0ZXMiLCJyZWNvcmQucmV2aWV3LWR1cGxpY2F0ZXMiLCJyZWNvcmQuZGVjbGFyYXRpb24tYXJjaGl2ZSIsInJlY29yZC5kZWNsYXJhdGlvbi1yZWluc3RhdGUiLCJyZWNvcmQucmVnaXN0ZXIiLCJyZWNvcmQucmVnaXN0cmF0aW9uLWNvcnJlY3QiLCJyZWNvcmQuZGVjbGFyYXRpb24tcHJpbnQtc3VwcG9ydGluZy1kb2N1bWVudHMiLCJyZWNvcmQuZXhwb3J0LXJlY29yZHMiLCJyZWNvcmQudW5hc3NpZ24tb3RoZXJzIiwicmVjb3JkLnJlZ2lzdHJhdGlvbi1wcmludCZpc3N1ZS1jZXJ0aWZpZWQtY29waWVzIiwicmVjb3JkLmNvbmZpcm0tcmVnaXN0cmF0aW9uIiwicmVjb3JkLnJlamVjdC1yZWdpc3RyYXRpb24iLCJwZXJmb3JtYW5jZS5yZWFkIiwicGVyZm9ybWFuY2UucmVhZC1kYXNoYm9hcmRzIiwicHJvZmlsZS5lbGVjdHJvbmljLXNpZ25hdHVyZSIsIm9yZ2FuaXNhdGlvbi5yZWFkLWxvY2F0aW9uczpteS1vZmZpY2UiLCJzZWFyY2guYmlydGgiLCJzZWFyY2guZGVhdGgiLCJzZWFyY2gubWFycmlhZ2UiLCJkZW1vIl0sImlhdCI6MTc0MTc5NjQ1NiwiZXhwIjoxNzQyNDAxMjU2LCJhdWQiOlsib3BlbmNydnM6YXV0aC11c2VyIiwib3BlbmNydnM6dXNlci1tZ250LXVzZXIiLCJvcGVuY3J2czpoZWFydGgtdXNlciIsIm9wZW5jcnZzOmdhdGV3YXktdXNlciIsIm9wZW5jcnZzOm5vdGlmaWNhdGlvbi11c2VyIiwib3BlbmNydnM6d29ya2Zsb3ctdXNlciIsIm9wZW5jcnZzOnNlYXJjaC11c2VyIiwib3BlbmNydnM6bWV0cmljcy11c2VyIiwib3BlbmNydnM6Y291bnRyeWNvbmZpZy11c2VyIiwib3BlbmNydnM6d2ViaG9va3MtdXNlciIsIm9wZW5jcnZzOmNvbmZpZy11c2VyIiwib3BlbmNydnM6ZG9jdW1lbnRzLXVzZXIiXSwiaXNzIjoib3BlbmNydnM6YXV0aC1zZXJ2aWNlIiwic3ViIjoiNjdiODdiODIzYzIxZGQxNDNiNjlmYTNlIn0.eB51kSYoLgcbv-Z5bAJQlD-G_K7hKSsEs46Gni9BRdlqHlXRcDVViKB6V_aAEXsWdnv5vJDrkXF8RWkaQjkYsGRwmhWqmevW2GLFQLTMmTRy7llsFYBAO2aIAmbYI3ZvM4rjxVyRY0dynAbqkhgr9m5LQpzNlsLHyrp5Ud4vJGct0nWwstDcn_JJwma5_JE_0fPZ7TaU5k0TrH-tK8_U_BuGjKXDm1rAShBOgZdrsNeRCPqgvMh584V42z910DMRjuBJFaOW12qtoXWIWiKMpOFuMtLFe6Pm7Yowcc5Ek9xw-rJ-ao-Rph8kxFJG-Fvilnp2ULvcTUGIZSjrbashZA";

test("verifies different sets of informants properly", async (t) => {
  const fastify = await buildFastify();
  await fastify.ready();

  /*
   * [🎂 Birth] payload includes [🤱 Mother]
   */
  await t.test("[🎂 Birth] [🤱 Mother] verifies mother", async () => {
    mswServer.use(
      http.post(env.IDA_AUTH_URL + "/*", () =>
        HttpResponse.json(
          { response: { authStatus: true, authToken: "xyz" } },
          { status: 200 },
        ),
      ),
    );

    const response = await fastify.inject({
      method: "POST",
      url: "/events/review",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VALID_JWT}`,
      },
      body: JSON.stringify(incomingBirthBundleMother),
    });

    const authenticationStatus = await response.json();

    assert.deepEqual(authenticationStatus, {
      mother: true,
      father: false,
      informant: false,
      deceased: false,
      spouse: false,
    });
  });

  await t.test("verifies no-one on authentication fail", async () => {
    mswServer.use(
      http.post(env.IDA_AUTH_URL + "/*", () =>
        HttpResponse.json({ response: { authStatus: false } }, { status: 200 }),
      ),
    );

    const response = await fastify.inject({
      method: "POST",
      url: "/events/review",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VALID_JWT}`,
      },
      body: JSON.stringify(incomingBirthBundleMother),
    });

    const authenticationStatus = await response.json();

    assert.deepEqual(authenticationStatus, {
      mother: false,
      father: false,
      informant: false,
      deceased: false,
      spouse: false,
    });
  });

  /*
   * [🎂 Birth] payload includes [🤱 Mother] [👨‍🍼 Father]
   */
  await t.test(
    "[🎂 Birth] [🤱 Mother] [👨‍🍼 Father] verifies mother & father",
    async () => {
      mswServer.use(
        http.post(env.IDA_AUTH_URL + "/*", () =>
          HttpResponse.json(
            { response: { authStatus: true, authToken: "token" } },
            { status: 200 },
          ),
        ),
      );

      const response = await fastify.inject({
        method: "POST",
        url: "/events/review",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_JWT}`,
        },
        body: JSON.stringify(incomingBirthBundleMotherFather),
      });

      const authenticationStatus = await response.json();

      return assert.deepEqual(authenticationStatus, {
        mother: true,
        father: true,
        informant: false,
        deceased: false,
        spouse: false,
      });
    },
  );

  await t.test(
    "[🎂 Birth] [🤱 Mother] [👨‍🍼 Father] verifies mother & fails father",
    async () => {
      mswServer.use(
        http.post(env.IDA_AUTH_URL + "/*", async ({ request }) => {
          const { individualId } = (await request.json()) as {
            individualId: string;
          };

          // 🤱 Mother
          if (individualId === "1234567890") {
            return HttpResponse.json(
              { response: { authStatus: true, authToken: "token" } },
              { status: 200 },
            );
          } else {
            return HttpResponse.json(
              { response: { authStatus: false } },
              { status: 200 },
            );
          }
        }),
      );

      const response = await fastify.inject({
        method: "POST",
        url: "/events/review",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_JWT}`,
        },
        body: JSON.stringify(incomingBirthBundleMotherFather),
      });

      const authenticationStatus = await response.json();

      return assert.deepEqual(authenticationStatus, {
        mother: true,
        father: false,
        informant: false,
        deceased: false,
        spouse: false,
      });
    },
  );

  /*
   * [🎂 Birth] payload includes [🛡️ Legal guardian] [🤱 Mother] [👨‍🍼 Father]
   */
  await t.test(
    "[🎂 Birth] [🛡️ Legal guardian] [🤱 Mother] [👨‍🍼 Father] verifies informant & mother & father",
    async () => {
      mswServer.use(
        http.post(env.IDA_AUTH_URL + "/*", () =>
          HttpResponse.json(
            { response: { authStatus: true, authToken: "token" } },
            { status: 200 },
          ),
        ),
      );

      const response = await fastify.inject({
        method: "POST",
        url: "/events/review",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_JWT}`,
        },
        body: JSON.stringify(incomingBirthBundleInformantMotherFather),
      });

      const authenticationStatus = await response.json();

      return assert.deepEqual(authenticationStatus, {
        mother: true,
        father: true,
        informant: true,
        deceased: false,
        spouse: false,
      });
    },
  );

  /*
   * [☠️ Death] payload includes  [⚰️ Deceased] [💍 Spouse]
   */
  await t.test(
    "[☠️ Death] payload includes  [⚰️ Deceased] [💍 Spouse] verifies deceased & spouse",
    async () => {
      mswServer.use(
        http.post(env.IDA_AUTH_URL + "/*", () =>
          HttpResponse.json(
            { response: { authStatus: true, authToken: "token" } },
            { status: 200 },
          ),
        ),
      );

      const response = await fastify.inject({
        method: "POST",
        url: "/events/review",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_JWT}`,
        },
        body: JSON.stringify(incomingBirthBundleDeceasedSpouse),
      });

      const authenticationStatus = await response.json();

      return assert.deepEqual(authenticationStatus, {
        mother: false,
        father: false,
        informant: false,
        deceased: true,
        spouse: true,
      });
    },
  );
});
