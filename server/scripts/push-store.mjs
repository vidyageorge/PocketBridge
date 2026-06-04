/**
 * Push PocketBridge data into PostgreSQL (Neon, Render Postgres, etc.) or via the API.
 *
 * From local SQLite file (default):
 *   set DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require
 *   node server/scripts/push-store.mjs
 *
 * From a JSON export (browser localStorage export):
 *   node server/scripts/push-store.mjs --file pocketbridge-export.json
 *
 * Through Render API (API must use the same DATABASE_URL / Neon):
 *   node server/scripts/push-store.mjs --api https://pocketbridge.onrender.com --file pocketbridge-export.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import pg from 'pg';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultSqlitePath = join(scriptDir, '..', 'data', 'pocketbridge.db');

function parseArgs(argv) {
  let filePath = null;
  let apiUrl = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--file' && argv[index + 1]) {
      filePath = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--file=')) {
      filePath = arg.slice('--file='.length);
      continue;
    }
    if (arg === '--api' && argv[index + 1]) {
      apiUrl = argv[index + 1].replace(/\/$/, '');
      index += 1;
      continue;
    }
    if (arg.startsWith('--api=')) {
      apiUrl = arg.slice('--api='.length).replace(/\/$/, '');
    }
  }

  return { filePath, apiUrl };
}

function loadPayloadFromSqlite(sqlitePath) {
  if (!existsSync(sqlitePath)) {
    throw new Error(`SQLite file not found: ${sqlitePath}`);
  }

  const database = new Database(sqlitePath, { readonly: true });
  const rows = database.prepare('SELECT key, value FROM app_store').all();
  database.close();

  const payload = {};
  for (const row of rows) {
    payload[row.key] = JSON.parse(row.value);
  }
  return payload;
}

function loadPayloadFromJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`JSON file not found: ${filePath}`);
  }

  const raw = readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Export file must be a JSON object: { "pocketbridge_txs": [...], ... }');
  }

  return parsed;
}

async function pushToPostgres(payload) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL to your Neon (or Postgres) connection string.');
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_store (
      key TEXT PRIMARY KEY NOT NULL,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) {
        continue;
      }

      await client.query(
        `
          INSERT INTO app_store (key, value, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = NOW()
        `,
        [key, JSON.stringify(value)],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function pushToApi(apiUrl, payload) {
  const response = await fetch(`${apiUrl}/api/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API migrate failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function main() {
  const { filePath, apiUrl } = parseArgs(process.argv.slice(2));

  const payload = filePath
    ? loadPayloadFromJson(filePath)
    : loadPayloadFromSqlite(defaultSqlitePath);

  const keys = Object.keys(payload);

  if (keys.length === 0) {
    console.error('No data found to push.');
    process.exit(1);
  }

  console.log(`Found ${keys.length} store key(s): ${keys.join(', ')}`);

  if (apiUrl) {
    const result = await pushToApi(apiUrl, payload);
    console.log(`Pushed via API ${apiUrl}:`, result);
    return;
  }

  await pushToPostgres(payload);
  console.log('Pushed directly to PostgreSQL (check Neon Tables → app_store).');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
