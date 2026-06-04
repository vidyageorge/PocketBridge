import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(__dirname, 'data');

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const databasePath = path.join(dataDirectory, 'pocketbridge.db');
const database = new Database(databasePath);

database.pragma('journal_mode = WAL');

database.exec(`
  CREATE TABLE IF NOT EXISTS app_store (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const selectValueStatement = database.prepare(
  'SELECT value FROM app_store WHERE key = ?',
);

const upsertValueStatement = database.prepare(`
  INSERT INTO app_store (key, value, updated_at)
  VALUES (@key, @value, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = datetime('now')
`);

const deleteValueStatement = database.prepare('DELETE FROM app_store WHERE key = ?');

const countStatement = database.prepare('SELECT COUNT(*) AS total FROM app_store');

export async function initDatabase() {
  return undefined;
}

/**
 * @param {string} key
 * @returns {Promise<unknown | null>}
 */
export async function readStoreValue(key) {
  const row = selectValueStatement.get(key);
  if (!row) {
    return null;
  }
  return JSON.parse(row.value);
}

/**
 * @param {string} key
 * @param {unknown} value
 */
export async function writeStoreValue(key, value) {
  upsertValueStatement.run({
    key,
    value: JSON.stringify(value),
  });
}

/**
 * @param {string} key
 */
export async function deleteStoreValue(key) {
  deleteValueStatement.run(key);
}

export async function isDatabaseEmpty() {
  const row = countStatement.get();
  return (row?.total ?? 0) === 0;
}

/**
 * @param {Record<string, unknown>} payload
 */
export async function migrateStorePayload(payload) {
  const transaction = database.transaction((entries) => {
    for (const [key, value] of entries) {
      if (value === undefined || value === null) {
        continue;
      }
      upsertValueStatement.run({
        key,
        value: JSON.stringify(value),
      });
    }
  });

  transaction(Object.entries(payload));
}

export function getDatabaseLabel() {
  return `sqlite:${databasePath}`;
}
