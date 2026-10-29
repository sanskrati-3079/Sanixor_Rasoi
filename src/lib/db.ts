import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Single-file SQLite database (Node's built-in driver). Suitable for one
 * server instance; see docs/decisions/0002-recipe-book-storage.md.
 */
export const DATA_DIR = path.resolve(
  process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data"),
);
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    source TEXT NOT NULL CHECK (source IN ('user', 'ai', 'kitchen')),
    title TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    diet TEXT,
    total_minutes INTEGER NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS recipes_created ON recipes (created_at DESC);
  CREATE INDEX IF NOT EXISTS recipes_author ON recipes (author_id);
`;

type GlobalWithDb = typeof globalThis & {
  __rasoiDb?: DatabaseSync;
  __rasoiDbInit?: Array<(db: DatabaseSync) => void>;
};

const globalForDb = globalThis as GlobalWithDb;

/** Hooks that run once after the schema exists (used for seeding). */
export function onDatabaseInit(hook: (db: DatabaseSync) => void) {
  (globalForDb.__rasoiDbInit ??= []).push(hook);
  if (globalForDb.__rasoiDb) hook(globalForDb.__rasoiDb);
}

export function getDb(): DatabaseSync {
  if (globalForDb.__rasoiDb) return globalForDb.__rasoiDb;

  mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "rasoi.db"));
  db.exec(SCHEMA);
  globalForDb.__rasoiDb = db;
  for (const hook of globalForDb.__rasoiDbInit ?? []) hook(db);
  return db;
}

/** Runs `work` inside a transaction, rolling back if it throws. */
export function transaction<T>(work: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = work(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
