const usePostgres = Boolean(process.env.DATABASE_URL);

const implementation = usePostgres
  ? await import('./db-postgres.mjs')
  : await import('./db-sqlite.mjs');

await implementation.initDatabase();

export const readStoreValue = implementation.readStoreValue;
export const writeStoreValue = implementation.writeStoreValue;
export const deleteStoreValue = implementation.deleteStoreValue;
export const isDatabaseEmpty = implementation.isDatabaseEmpty;
export const migrateStorePayload = implementation.migrateStorePayload;

export function getDatabasePath() {
  return implementation.getDatabaseLabel();
}
