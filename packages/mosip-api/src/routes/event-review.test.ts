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
import jwt from "jsonwebtoken";
import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const payload = {
  scope: ["record.confirm-registration", "record.reject-registration"],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Expires in 1 week
  aud: ["opencrvs:auth-user"],
  iss: "opencrvs:auth-service",
  sub: "67b87b823c21dd143b69fa3e",
};

const VALID_JWT = jwt.sign(payload, privateKey, { algorithm: "RS256" });

const mswServer = setupServer(
  http.get(env.OPENCRVS_PUBLIC_KEY_URL, () => HttpResponse.text(publicKey)),
  http.post(env.OPENCRVS_GRAPHQL_GATEWAY_URL, () =>
    HttpResponse.json({}, { status: 200 }),
  ),
);
mswServer.listen();

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

  await t.test(
    "[☠️ Death] payload includes  [⚰️ Deceased] [💍 Spouse] fails deceased & verifies spouse",
    async () => {
      mswServer.use(
        http.post(env.IDA_AUTH_URL + "/*", async ({ request }) => {
          const { individualId } = (await request.json()) as {
            individualId: string;
          };

          // 🤱 Deceased
          if (individualId === "1234512345") {
            return HttpResponse.json(
              { response: { authStatus: false } },
              { status: 200 },
            );
          } else {
            return HttpResponse.json(
              { response: { authStatus: true, authToken: "token" } },
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
        body: JSON.stringify(incomingBirthBundleDeceasedSpouse),
      });

      const authenticationStatus = await response.json();

      return assert.deepEqual(authenticationStatus, {
        mother: false,
        father: false,
        informant: false,
        deceased: false,
        spouse: true,
      });
    },
  );
});
