import DatabaseSync, { Database } from "better-sqlite3";
import { env } from "./constants";
import path from "node:path";
import fs from "node:fs";

/*
 * Lightweight SQLite database for storing transaction id with a JWT token
 * OpenCRVS Core issues a record-specific token used to confirm the registration after it is received from MOSIP.
 * Optimally, MOSIP could receive this token as metadata and return it back in WebSub to avoid storage, but this is not currently supported by MOSIP.
 */

let database: Database;

export const initSqlite = () => {
  const dir = path.dirname(env.SQLITE_DATABASE_PATH);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  database = new DatabaseSync(env.SQLITE_DATABASE_PATH);

  const tableExists = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'",
    )
    .get();

  // `CREATE TABLE IF EXISTS` works too, but we want to log differently on creation
  if (!tableExists) {
    database.exec(`
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE,
        tracking_id TEXT UNIQUE,
        created_at TEXT DEFAULT (datetime('now'))
      ) STRICT
    `);
  }

  return { wasCreated: !tableExists, wasConnected: tableExists };
};

export const insertTransaction = (
  id: string,
  token: string,
  trackingId: string,
) =>
  database
    .prepare(
      "INSERT INTO transactions (id, token, tracking_id) VALUES (?, ?, ?)",
    )
    .run(id, token, trackingId);

export const getTransactionAndDiscard = (id: string) => {
  const remove = database
    .prepare(
      "DELETE FROM transactions WHERE id = ? RETURNING token, tracking_id",
    )
    .get(id) as { token: string; tracking_id: string } | undefined;

  if (!remove) {
    throw new Error(`Transaction with id '${id}' not found.`);
  }

  return { token: remove.token, trackingId: remove.tracking_id };
};
