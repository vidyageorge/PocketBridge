import procurementSeed from '@/data/procurement-seed.json';
import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { ProcurementRecord } from '@/types/procurement';

export const PROCUREMENT_STORAGE_KEY = STORE_KEYS.PROCUREMENT;

export function loadProcurementRecords(): ProcurementRecord[] {
  const parsed = getCachedStoreValue<ProcurementRecord[] | null>(
    STORE_KEYS.PROCUREMENT,
    null,
  );

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return seedProcurementRecords();
  }

  return parsed;
}

export function saveProcurementRecords(records: ProcurementRecord[]): void {
  setCachedStoreValue(STORE_KEYS.PROCUREMENT, records);
}

export function getNextProcurementId(records: ProcurementRecord[]): number {
  return records.reduce((maxId, record) => Math.max(maxId, record.id), 0) + 1;
}

export function seedProcurementRecords(): ProcurementRecord[] {
  const seeded = procurementSeed as ProcurementRecord[];
  saveProcurementRecords(seeded);
  return seeded;
}
