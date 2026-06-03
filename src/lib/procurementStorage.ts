import procurementSeed from '@/data/procurement-seed.json';
import type { ProcurementRecord } from '@/types/procurement';

export const PROCUREMENT_STORAGE_KEY = 'pocketbridge_procurement';

export function loadProcurementRecords(): ProcurementRecord[] {
  try {
    const stored = localStorage.getItem(PROCUREMENT_STORAGE_KEY);
    if (!stored) {
      return seedProcurementRecords();
    }

    const parsed = JSON.parse(stored) as ProcurementRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return seedProcurementRecords();
    }

    return parsed;
  } catch {
    return seedProcurementRecords();
  }
}

export function saveProcurementRecords(records: ProcurementRecord[]): void {
  localStorage.setItem(PROCUREMENT_STORAGE_KEY, JSON.stringify(records));
}

export function getNextProcurementId(records: ProcurementRecord[]): number {
  return records.reduce((maxId, record) => Math.max(maxId, record.id), 0) + 1;
}

export function seedProcurementRecords(): ProcurementRecord[] {
  const seeded = procurementSeed as ProcurementRecord[];
  saveProcurementRecords(seeded);
  return seeded;
}
