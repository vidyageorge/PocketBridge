import { STORE_KEYS, type StoreKey } from '@/lib/storeKeys';

export type DataBackendMode = 'api' | 'local';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

let mode: DataBackendMode = 'local';
let initialized = false;
const cache = new Map<string, unknown>();

function readLocalStorage(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

async function fetchFromApi(key: string): Promise<unknown | null> {
  const response = await fetch(`${API_BASE}/api/store/${encodeURIComponent(key)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load ${key}: ${response.status}`);
  }
  return (await response.json()) as unknown;
}

async function writeToApi(key: string, value: unknown): Promise<void> {
  const response = await fetch(`${API_BASE}/api/store/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!response.ok) {
    throw new Error(`Failed to save ${key}: ${response.status}`);
  }
}

async function detectApiBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(2500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Builds a payload from all PocketBridge keys currently in browser localStorage. */
export function buildLocalStoragePayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  Object.values(STORE_KEYS).forEach((key) => {
    const value = readLocalStorage(key);
    if (value !== null) {
      payload[key] = value;
    }
  });

  return payload;
}

/** POSTs localStorage data to the configured API (Neon/Postgres behind the API). */
export async function pushLocalStorageToApi(): Promise<string[]> {
  if (!API_BASE) {
    throw new Error('VITE_API_URL is not set. Point the app at your API first.');
  }

  const payload = buildLocalStoragePayload();
  const keys = Object.keys(payload);

  if (keys.length === 0) {
    throw new Error('No PocketBridge data found in this browser localStorage.');
  }

  const response = await fetch(`${API_BASE}/api/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Migration failed: ${response.status}`);
  }

  return keys;
}

async function migrateLocalStorageToApi(): Promise<void> {
  const keys = Object.keys(buildLocalStoragePayload());
  if (keys.length === 0) {
    return;
  }
  await pushLocalStorageToApi();
}

function localValueHasData(key: StoreKey, value: unknown): boolean {
  if (value === null) {
    return false;
  }

  if (key === STORE_KEYS.EXPENSES && typeof value === 'object') {
    const expenseData = value as { project?: unknown[]; employee?: unknown[] };
    return (
      (expenseData.project?.length ?? 0) > 0 || (expenseData.employee?.length ?? 0) > 0
    );
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value as object).length > 0;
  }

  return true;
}

function cloudValueIsEmpty(key: StoreKey, value: unknown | null): boolean {
  if (value === null) {
    return true;
  }

  if (key === STORE_KEYS.EXPENSES && typeof value === 'object') {
    const expenseData = value as { project?: unknown[]; employee?: unknown[] };
    return (
      (expenseData.project?.length ?? 0) === 0 && (expenseData.employee?.length ?? 0) === 0
    );
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

/** Uploads browser keys that have data when the cloud copy is missing or empty. */
async function syncLocalKeysMissingOnCloud(): Promise<void> {
  const payload: Record<string, unknown> = {};

  for (const key of Object.values(STORE_KEYS)) {
    const local = readLocalStorage(key);
    if (!localValueHasData(key as StoreKey, local)) {
      continue;
    }

    const remote = await fetchFromApi(key);
    if (!cloudValueIsEmpty(key as StoreKey, remote)) {
      continue;
    }

    payload[key] = local;
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  const response = await fetch(`${API_BASE}/api/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
}

async function loadKeyIntoCache(key: StoreKey): Promise<void> {
  if (mode === 'api') {
    const value = await fetchFromApi(key);
    if (value !== null) {
      cache.set(key, value);
    }
    return;
  }

  const local = readLocalStorage(key);
  if (local !== null) {
    cache.set(key, local);
  }
}

/**
 * Connects to the API when available and hydrates the in-memory cache.
 */
export async function initDataBackend(): Promise<DataBackendMode> {
  if (initialized) {
    return mode;
  }

  const useApi = await detectApiBackend();
  mode = useApi ? 'api' : 'local';

  if (mode === 'api') {
    const health = (await fetch(`${API_BASE}/api/health`).then((response) =>
      response.json(),
    )) as { empty?: boolean };

    if (health.empty) {
      await migrateLocalStorageToApi();
    } else {
      await syncLocalKeysMissingOnCloud();
    }
  }

  cache.clear();
  await Promise.all(
    Object.values(STORE_KEYS).map((key) => loadKeyIntoCache(key as StoreKey)),
  );
  initialized = true;
  return mode;
}

export function getDataBackendMode(): DataBackendMode {
  return mode;
}

export function isDataBackendReady(): boolean {
  return initialized;
}

export function getCachedStoreValue<T>(key: StoreKey, fallback: T): T {
  const value = cache.get(key);
  if (value === undefined) {
    return fallback;
  }
  return value as T;
}

export function setCachedStoreValue<T>(key: StoreKey, value: T): T {
  cache.set(key, value);

  if (mode === 'api') {
    void writeToApi(key, value).catch((error) => {
      console.error(`API save failed for ${key}`, error);
    });
  } else {
    writeLocalStorage(key, value);
  }

  return value;
}
