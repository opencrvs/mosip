import test from "node:test";
import assert from "node:assert";
import { buildFastify } from "./index";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { env } from "./constants";

const mswServer = setupServer(
  http.get(env.OPENCRVS_PUBLIC_KEY_URL, () => {
    return HttpResponse.text(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuAYLAh4YuRfMkH/VCwNS
pPUelpojcpEAUycsx8EEwMS/BzzqY1991CN5dljCw8WB7J9T7Buoql/ZxCC/lan8
4wFW7/msT0hvTswDuzzD62VSQ32uxe5SP4E1s3FjbqXroXC4gW5VVqopkvgdMbIo
fPoSxiheof7qyBJXiW84F0cKdwAjD39Q8fg66IrrzCjFjQTDbUTThXOj7+QxNlvP
KaFLoDDylIZBP2hM1Z0NkrY3C6BXLUp4D4qU9QbtMhD2qxz3zl39XbsE43rxu/Kp
VrVwQoDmo/yirzsNBCicXpjyj14X2L92YN7016r0oXRXEa6fPNiPQAvpqZea6l1T
CwIDAQAB
-----END PUBLIC KEY-----`);
  }),
);
mswServer.listen();

const VALID_JWT =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWNvcmQuZGVjbGFyZS1iaXJ0aCIsInJlY29yZC5kZWNsYXJlLWRlYXRoIiwicmVjb3JkLmRlY2xhcmUtbWFycmlhZ2UiLCJyZWNvcmQuZGVjbGFyYXRpb24tZWRpdCIsInJlY29yZC5kZWNsYXJhdGlvbi1zdWJtaXQtZm9yLXVwZGF0ZXMiLCJyZWNvcmQucmV2aWV3LWR1cGxpY2F0ZXMiLCJyZWNvcmQuZGVjbGFyYXRpb24tYXJjaGl2ZSIsInJlY29yZC5kZWNsYXJhdGlvbi1yZWluc3RhdGUiLCJyZWNvcmQucmVnaXN0ZXIiLCJyZWNvcmQucmVnaXN0cmF0aW9uLWNvcnJlY3QiLCJyZWNvcmQuZGVjbGFyYXRpb24tcHJpbnQtc3VwcG9ydGluZy1kb2N1bWVudHMiLCJyZWNvcmQuZXhwb3J0LXJlY29yZHMiLCJyZWNvcmQudW5hc3NpZ24tb3RoZXJzIiwicmVjb3JkLnJlZ2lzdHJhdGlvbi1wcmludCZpc3N1ZS1jZXJ0aWZpZWQtY29waWVzIiwicmVjb3JkLmNvbmZpcm0tcmVnaXN0cmF0aW9uIiwicmVjb3JkLnJlamVjdC1yZWdpc3RyYXRpb24iLCJwZXJmb3JtYW5jZS5yZWFkIiwicGVyZm9ybWFuY2UucmVhZC1kYXNoYm9hcmRzIiwicHJvZmlsZS5lbGVjdHJvbmljLXNpZ25hdHVyZSIsIm9yZ2FuaXNhdGlvbi5yZWFkLWxvY2F0aW9uczpteS1vZmZpY2UiLCJzZWFyY2guYmlydGgiLCJzZWFyY2guZGVhdGgiLCJzZWFyY2gubWFycmlhZ2UiLCJkZW1vIl0sImlhdCI6MTc0MTc5NjQ1NiwiZXhwIjoxNzQyNDAxMjU2LCJhdWQiOlsib3BlbmNydnM6YXV0aC11c2VyIiwib3BlbmNydnM6dXNlci1tZ250LXVzZXIiLCJvcGVuY3J2czpoZWFydGgtdXNlciIsIm9wZW5jcnZzOmdhdGV3YXktdXNlciIsIm9wZW5jcnZzOm5vdGlmaWNhdGlvbi11c2VyIiwib3BlbmNydnM6d29ya2Zsb3ctdXNlciIsIm9wZW5jcnZzOnNlYXJjaC11c2VyIiwib3BlbmNydnM6bWV0cmljcy11c2VyIiwib3BlbmNydnM6Y291bnRyeWNvbmZpZy11c2VyIiwib3BlbmNydnM6d2ViaG9va3MtdXNlciIsIm9wZW5jcnZzOmNvbmZpZy11c2VyIiwib3BlbmNydnM6ZG9jdW1lbnRzLXVzZXIiXSwiaXNzIjoib3BlbmNydnM6YXV0aC1zZXJ2aWNlIiwic3ViIjoiNjdiODdiODIzYzIxZGQxNDNiNjlmYTNlIn0.eB51kSYoLgcbv-Z5bAJQlD-G_K7hKSsEs46Gni9BRdlqHlXRcDVViKB6V_aAEXsWdnv5vJDrkXF8RWkaQjkYsGRwmhWqmevW2GLFQLTMmTRy7llsFYBAO2aIAmbYI3ZvM4rjxVyRY0dynAbqkhgr9m5LQpzNlsLHyrp5Ud4vJGct0nWwstDcn_JJwma5_JE_0fPZ7TaU5k0TrH-tK8_U_BuGjKXDm1rAShBOgZdrsNeRCPqgvMh584V42z910DMRjuBJFaOW12qtoXWIWiKMpOFuMtLFe6Pm7Yowcc5Ek9xw-rJ-ao-Rph8kxFJG-Fvilnp2ULvcTUGIZSjrbashZA";
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
