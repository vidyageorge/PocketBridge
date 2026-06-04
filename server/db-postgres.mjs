import pg from 'pg';

const { Pool } = pg;

/** @type {import('pg').Pool | null} */
let pool = null;

export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for PostgreSQL');
  }

  pool = new Pool({
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
}

/**
 * @param {string} key
 * @returns {Promise<unknown | null>}
 */
export async function readStoreValue(key) {
  const result = await pool.query('SELECT value FROM app_store WHERE key = $1', [key]);
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0].value;
}

/**
 * @param {string} key
 * @param {unknown} value
 */
export async function writeStoreValue(key, value) {
  await pool.query(
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

/**
 * @param {string} key
 */
export async function deleteStoreValue(key) {
  await pool.query('DELETE FROM app_store WHERE key = $1', [key]);
}

export async function isDatabaseEmpty() {
  const result = await pool.query('SELECT COUNT(*)::int AS total FROM app_store');
  return (result.rows[0]?.total ?? 0) === 0;
}

/**
 * @param {Record<string, unknown>} payload
 */
export async function migrateStorePayload(payload) {
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
  }
}

export function getDatabaseLabel() {
  return 'postgres:render';
}
