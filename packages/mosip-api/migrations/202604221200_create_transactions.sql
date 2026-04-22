CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;
