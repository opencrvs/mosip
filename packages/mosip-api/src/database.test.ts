import test, { it } from "node:test";
import * as db from "./database";
import assert from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("SQLite", async () => {
  await it("inserts and removes transactions", () => {
    const { database } = db.initSqlite(":memory:");

    db.insertTransaction("1", "token1", "registrationNumber1");
    db.insertTransaction("2", "token2", "registrationNumber2");
    db.insertTransaction("3", "token3", "registrationNumber3");
    db.insertTransaction("4", "token4", "registrationNumber4");

    assert.strictEqual(
      database.prepare("SELECT * FROM transactions").all().length,
      4,
    );

    db.getTransactionAndDiscard("1");
    db.getTransactionAndDiscard("2");
    db.getTransactionAndDiscard("3");
    db.getTransactionAndDiscard("4");

    assert.strictEqual(
      database.prepare("SELECT * FROM transactions").all().length,
      0,
    );

    db.exit();
  });

  await it("throws on registration number conflict", () => {
    db.initSqlite(":memory:");

    assert.throws(() => {
      db.insertTransaction("2", "token2", "registrationNumber1");
      db.insertTransaction("1", "token1", "registrationNumber1");
    });

    db.exit();
  });

  await it("records applied migrations", () => {
    const { database, appliedMigrations } = db.initSqlite(":memory:");

    assert.strictEqual(appliedMigrations, 1);
    assert.deepStrictEqual(
      database.prepare("SELECT COUNT(*) as count FROM schema_migrations").get(),
      { count: 1 },
    );

    db.exit();
  });

  await it("rejects changed migration checksum", () => {
    const workspace = mkdtempSync(join(tmpdir(), "mosip-migrations-"));
    const migrationsPath = join(workspace, "migrations");
    mkdirSync(migrationsPath, { recursive: true });

    const migrationFile = join(migrationsPath, "0001_create_table.sql");
    writeFileSync(
      migrationFile,
      "CREATE TABLE demo (id TEXT PRIMARY KEY) STRICT;",
    );

    const sqlitePath = join(workspace, "test.sqlite");
    const first = db.initSqlite(sqlitePath, { migrationsPath });
    first.database.close();

    writeFileSync(
      migrationFile,
      "CREATE TABLE demo (id TEXT PRIMARY KEY, name TEXT) STRICT;",
    );

    assert.throws(
      () => db.initSqlite(sqlitePath, { migrationsPath }),
      /checksum mismatch/,
    );

    db.exit();
  });
});
