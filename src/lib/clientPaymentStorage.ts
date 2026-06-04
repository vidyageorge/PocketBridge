import clientPaymentSeed from '@/data/client-payment-seed.json';
import { buildClientPaymentRegistry } from '@/lib/clientPayment';
import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import {
  loadClientPaymentRegistry,
  saveClientPaymentRegistry,
} from '@/lib/clientPaymentRegistryStorage';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { ClientPaymentRecord } from '@/types/clientPayment';

export const CLIENT_PAYMENT_STORAGE_KEY = STORE_KEYS.CLIENT_PAYMENTS;
export const CLIENT_PAYMENT_SEED_VERSION_KEY = STORE_KEYS.CLIENT_PAYMENT_SEED_VERSION;
export const CLIENT_PAYMENT_SEED_VERSION = 2;

function getStoredSeedVersion(): string | null {
  return getCachedStoreValue<string | null>(
    STORE_KEYS.CLIENT_PAYMENT_SEED_VERSION,
    null,
  );
}

function setStoredSeedVersion(): void {
  setCachedStoreValue(
    STORE_KEYS.CLIENT_PAYMENT_SEED_VERSION,
    String(CLIENT_PAYMENT_SEED_VERSION),
  );
}

function shouldLoadSeedFromFile(): boolean {
  return getStoredSeedVersion() !== String(CLIENT_PAYMENT_SEED_VERSION);
}

/**
 * Loads client payment rows, seeding from the workbook export when needed.
 */
export function loadClientPaymentRecords(): ClientPaymentRecord[] {
  try {
    if (shouldLoadSeedFromFile()) {
      return seedClientPaymentRecords();
    }

    const parsed = getCachedStoreValue<ClientPaymentRecord[] | null>(
      STORE_KEYS.CLIENT_PAYMENTS,
      null,
    );

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return seedClientPaymentRecords();
    }

    return parsed;
  } catch {
    return seedClientPaymentRecords();
  }
}

export function saveClientPaymentRecords(records: ClientPaymentRecord[]): void {
  setCachedStoreValue(STORE_KEYS.CLIENT_PAYMENTS, records);
}

export function seedClientPaymentRecords(): ClientPaymentRecord[] {
  const seeded = clientPaymentSeed as ClientPaymentRecord[];
  saveClientPaymentRecords(seeded);
  setStoredSeedVersion();
  saveClientPaymentRegistry(buildClientPaymentRegistry(seeded));
  return seeded;
}

/**
 * Ensures project/client registry exists when payment rows are already stored.
 */
export function ensureClientPaymentRegistry(records: ClientPaymentRecord[]): void {
  const registry = loadClientPaymentRegistry();
  if (registry.projects.length > 0 || records.length === 0) {
    return;
  }

  saveClientPaymentRegistry(buildClientPaymentRegistry(records));
}
