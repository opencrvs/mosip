import test, { it } from "node:test";
import assert from "node:assert";
import { createHmac } from "node:crypto";
import { env } from "../constants";
import { verifyHubSignatureOrThrow } from "./verify-hub-signature";

/*
 * That MOSIP's hub really produces `sha256=<hex>` over the verbatim request
 * body, keyed by `hub.secret`, was confirmed against a live MOSIP Collab
 * delivery: the recomputed digest matched the received header byte for byte,
 * with the raw body length equal to `content-length`. These tests pin the
 * behaviour that verification depends on.
 */

const BODY = Buffer.from(
  JSON.stringify({
    publisher: "CREDENTIAL_SERVICE",
    topic: "CREDENTIAL_ISSUED",
  }),
);

const sign = (body: Buffer, secret = env.MOSIP_WEBSUB_SECRET) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

test("X-Hub-Signature", async () => {
  await it("accepts a signature produced with the hub secret", () => {
    assert.doesNotThrow(() => verifyHubSignatureOrThrow(sign(BODY), BODY));
  });

  await it("rejects a signature produced with a different secret", () => {
    assert.throws(
      () => verifyHubSignatureOrThrow(sign(BODY, "not-the-hub-secret"), BODY),
      /does not match/,
    );
  });

  // The point of the whole exercise: the body cannot be altered in transit.
  await it("rejects a body that does not match the signature", () => {
    const tampered = Buffer.concat([BODY, Buffer.from(" ")]);
    assert.throws(
      () => verifyHubSignatureOrThrow(sign(BODY), tampered),
      /does not match/,
    );
  });

  await it("rejects a missing header", () => {
    assert.throws(
      () => verifyHubSignatureOrThrow(undefined, BODY),
      /Missing X-Hub-Signature/,
    );
  });

  await it("rejects a truncated signature rather than comparing short", () => {
    assert.throws(
      () => verifyHubSignatureOrThrow(sign(BODY).slice(0, 30), BODY),
      /does not match/,
    );
  });

  await it("rejects an unknown digest method", () => {
    assert.throws(
      () => verifyHubSignatureOrThrow("md5=deadbeef", BODY),
      /Unsupported X-Hub-Signature format/,
    );
  });

  // A body that was parsed but never retained must fail closed, not pass.
  await it("refuses to pass when the raw body was not captured", () => {
    assert.throws(
      () => verifyHubSignatureOrThrow(sign(BODY), undefined),
      /without the raw body/,
    );
  });
});
