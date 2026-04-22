import DatabaseSync, { Database } from "better-sqlite3";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * Lightweight SQLite database for storing transaction id with a JWT token
 *
 * OpenCRVS Core issues a record-specific token used to confirm the registration after it is received from MOSIP.
 * Optimally, MOSIP could receive this token as metadata and return it back in WebSub to avoid storage, but this is not currently supported by MOSIP.
 */

const DEFAULT_MIGRATIONS_PATH = join(__dirname, "../migrations");

const CREATE_MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  ) STRICT
`;

let database: Database;

const hashSql = (sql: string) => {
  return createHash("sha256").update(sql).digest("hex");
};

const getMigrationFilenames = (migrationsPath: string) => {
  return readdirSync(migrationsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
};

const applyMigrations = (database: Database, migrationsPath: string) => {
  database.exec(CREATE_MIGRATION_TABLE_SQL);

  const appliedMigrations = database
    .prepare("SELECT id, checksum FROM schema_migrations")
    .all() as Array<{ id: string; checksum: string }>;

  const appliedChecksumById = new Map(
    appliedMigrations.map(({ id, checksum }) => [id, checksum]),
  );

  let appliedCount = 0;
  const migrationFilenames = getMigrationFilenames(migrationsPath);

  for (const migrationFilename of migrationFilenames) {
    const migrationPath = join(migrationsPath, migrationFilename);
    const sql = readFileSync(migrationPath, "utf8").trim();

    if (!sql) {
      throw new Error(`Migration '${migrationFilename}' is empty.`);
    }

    const checksum = hashSql(sql);
    const appliedChecksum = appliedChecksumById.get(migrationFilename);

    if (appliedChecksum) {
      if (appliedChecksum !== checksum) {
        throw new Error(
          `Migration '${migrationFilename}' checksum mismatch. Existing migrations must not be changed after deployment.`,
        );
      }
      continue;
    }

    const applyMigration = database.transaction(() => {
      database.exec(sql);
      database
        .prepare("INSERT INTO schema_migrations (id, checksum) VALUES (?, ?)")
        .run(migrationFilename, checksum);
    });

    applyMigration();
    appliedCount += 1;
  }

  return { appliedCount };
};

export const initSqlite = (
  path: string,
  {
    migrationsPath = DEFAULT_MIGRATIONS_PATH,
  }: { migrationsPath?: string } = {},
) => {
  database = new DatabaseSync(path);

  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");

  const migrationTableExists = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
    )
    .get();

  const { appliedCount } = applyMigrations(database, migrationsPath);

  return {
    wasCreated: !migrationTableExists,
    wasConnected: Boolean(migrationTableExists),
    appliedMigrations: appliedCount,
    database,
  };
};

export const insertTransaction = (
  id: string,
  token: string,
  registrationNumber: string,
) =>
  database
    .prepare(
      "INSERT INTO transactions (id, token, registration_number) VALUES (?, ?, ?)",
    )
    .run(id, token, registrationNumber);

export const getTransactionAndDiscard = (id: string) => {
  const remove = database
    .prepare(
      "DELETE FROM transactions WHERE id = ? RETURNING token, registration_number",
    )
    .get(id) as { token: string; registration_number: string } | undefined;

  if (!remove) {
    throw new Error(`Transaction with id '${id}' not found.`);
  }

  return {
    token: remove.token,
    registrationNumber: remove.registration_number,
  };
};

/**
 * Retrieves all transactions from the database.
 *
 * @warning
 * This function is intended for **debugging purposes only** as it exposes sensitive data.
 */
export const getAllTransactions = () => {
  return database
    .prepare(
      "SELECT id, registration_number, token, created_at FROM transactions",
    )
    .all() as Array<{
    id: string;
    registration_number: string;
    token: string;
    created_at: string;
  }>;
};

export const exit = () => database.close();
