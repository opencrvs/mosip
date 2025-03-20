import test from "node:test";
import assert from "node:assert";
import { buildFastify } from "./index";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { env } from "./constants";
import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";

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

const mswServer = setupServer(
  http.get(env.OPENCRVS_PUBLIC_KEY_URL, () => {
    return HttpResponse.text(publicKey);
  }),
);
mswServer.listen();

const VALID_JWT = jwt.sign(payload, privateKey, { algorithm: "RS256" });
const INVALID_JWT =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWNvcmQuZGVjbGFyZS1iaXJ0aCIsInJlY29yZC5kZWNsYXJlLWRlYXRoIiwicmVjb3JkLmRlY2xhcmUtbWFycmlhZ2UiLCJyZWNvcmQuZGVjbGFyYXRpb24tZWRpdCIsInJlY29yZC5kZWNsYXJhdGlvbi1zdWJtaXQtZm9yLXVwZGF0ZXMiLCJyZWNvcmQucmV2aWV3LWR1cGxpY2F0ZXMiLCJyZWNvcmQuZGVjbGFyYXRpb24tYXJjaGl2ZSIsInJlY29yZC5kZWNsYXJhdGlvbi1yZWluc3RhdGUiLCJyZWNvcmQucmVnaXN0ZXIiLCJyZWNvcmQucmVnaXN0cmF0aW9uLWNvcnJlY3QiLCJyZWNvcmQuZGVjbGFyYXRpb24tcHJpbnQtc3VwcG9ydGluZy1kb2N1bWVudHMiLCJyZWNvcmQuZXhwb3J0LXJlY29yZHMiLCJyZWNvcmQudW5hc3NpZ24tb3RoZXJzIiwicmVjb3JkLnJlZ2lzdHJhdGlvbi1wcmludCZpc3N1ZS1jZXJ0aWZpZWQtY29waWVzIiwicmVjb3JkLmNvbmZpcm0tcmVnaXN0cmF0aW9uIiwicmVjb3JkLnJlamVjdC1yZWdpc3RyYXRpb24iLCJwZXJmb3JtYW5jZS5yZWFkIiwicGVyZm9ybWFuY2UucmVhZC1kYXNoYm9hcmRzIiwicHJvZmlsZS5lbGVjdHJvbmljLXNpZ25hdHVyZSIsIm9yZ2FuaXNhdGlvbi5yZWFkLWxvY2F0aW9uczpteS1vZmZpY2UiLCJ1c2VyLnJlYWQ6bXktb2ZmaWNlIiwic2VhcmNoLmJpcnRoIiwic2VhcmNoLmRlYXRoIiwic2VhcmNoLm1hcnJpYWdlIiwiZGVtbyJdLCJpYXQiOjE3NDE3OTY0ODUsImV4cCI6MTc0MjQwMTI4NSwiYXVkIjpbIm9wZW5jcnZzOmF1dGgtdXNlciIsIm9wZW5jcnZzOnVzZXItbWdudC11c2VyIiwib3BlbmNydnM6aGVhcnRoLXVzZXIiLCJvcGVuY3J2czpnYXRld2F5LXVzZXIiLCJvcGVuY3J2czpub3RpZmljYXRpb24tdXNlciIsIm9wZW5jcnZzOndvcmtmbG93LXVzZXIiLCJvcGVuY3J2czpzZWFyY2gtdXNlciIsIm9wZW5jcnZzOm1ldHJpY3MtdXNlciIsIm9wZW5jcnZzOmNvdW50cnljb25maWctdXNlciIsIm9wZW5jcnZzOndlYmhvb2tzLXVzZXIiLCJvcGVuY3J2czpjb25maWctdXNlciIsIm9wZW5jcnZzOmRvY3VtZW50cy11c2VyIl0sImlzcyI6Im9wZW5jcnZzOmF1dGgtc2VydmljZSIsInN1YiI6IjY3ZDE5NjE4OGE1MTU1NjU0NDVjYWUxNCJ9.hlVMc-lnU8UD4Mlpf3l-bpoVdbMiCbKQqfv3p1od4y6l7GDjWqIhna04jw7RtPMfx6mZva08E80T0j2fKwhb7bQO3R8ksvVeHaLrJJVd-l14HJpiW3DmbZ5I4IskB-1RY0Z_UXBhF9sMU-GBunS3jFR0CKDi2RdUBng9Arezp6n30PSc7d4OszJ6NVj3_nbXxekMH6G6kyoagGkfPaQFIYGLoDhC7Mpor9Mu8mkoS5W1Tiqq4aNbAJbiPlflrR5PSdu4nnJ9nQcpy48RQwZr4WR562Wydy8BtQa3Y9P_ZOC9y-3YnDAfGU657g9EoEww1E0dclp-hU54zNYUjfPCRA";

test("validates JWTs", async (t) => {
  const fastify = await buildFastify();
  await fastify.ready();

  await t.test("should reject an invalid JWT", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/events/registration",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INVALID_JWT}`,
      },
      body: JSON.stringify({
        resourceType: "Bundle",
        type: "document",
        entry: [],
      }),
    });

    assert.strictEqual(response.statusCode, 401);
  });

  await t.test("should accept a valid JWT", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/events/registration",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VALID_JWT}`,
      },
      body: JSON.stringify({
        resourceType: "Bundle",
        type: "document",
        entry: [],
      }),
    });

    assert.notStrictEqual(response.statusCode, 401);
  });

  await fastify.close();
});
