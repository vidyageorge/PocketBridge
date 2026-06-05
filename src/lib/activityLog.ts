import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS, type StoreKey } from '@/lib/storeKeys';
import type {
  ActivityFieldChange,
  ActivityLogEntry,
  ActivityUndoPayload,
  RecordActivityInput,
} from '@/types/activityLog';

export const ACTIVITY_LOG_RETENTION_DAYS = 30;
export const ACTIVITY_LOG_ACTOR = 'You';

const STORE_FALLBACKS: Record<StoreKey, unknown> = {
  [STORE_KEYS.TRANSACTIONS]: [],
  [STORE_KEYS.ACCOUNT_BALANCES]: [],
  [STORE_KEYS.CLIENT_PAYMENTS]: [],
  [STORE_KEYS.CLIENT_PAYMENT_REGISTRY]: { projects: [], clientNames: [] },
  [STORE_KEYS.CLIENT_PAYMENT_SEED_VERSION]: 0,
  [STORE_KEYS.PROCUREMENT]: [],
  [STORE_KEYS.SUPPLIER_REGISTRY]: { supplierNames: [] },
  [STORE_KEYS.EXPENSES]: { project: [], employee: [] },
  [STORE_KEYS.CUSTOM_OPTIONS]: {},
  [STORE_KEYS.ACTIVITY_LOG]: [],
};

/**
 * Deep-clones current cached store values for undo snapshots.
 */
export function captureStoreSnapshot(keys: StoreKey[]): ActivityUndoPayload {
  const stores: Partial<Record<StoreKey, unknown>> = {};

  keys.forEach((key) => {
    const value = getCachedStoreValue(key, STORE_FALLBACKS[key]);
    stores[key] = structuredClone(value);
  });

  return { stores };
}

/**
 * Restores store keys from an undo payload and persists them.
 */
export function applyUndoPayload(payload: ActivityUndoPayload): void {
  Object.entries(payload.stores).forEach(([key, value]) => {
    setCachedStoreValue(key as StoreKey, value);
  });
}

export function createActivityLogEntry(input: RecordActivityInput): ActivityLogEntry {
  return {
    id: crypto.randomUUID(),
    action: input.action,
    entityType: input.entityType,
    title: input.title,
    detail: input.detail,
    actor: ACTIVITY_LOG_ACTOR,
    createdAt: new Date().toISOString(),
    changes: input.changes ?? [],
    undoPayload: input.undoPayload,
    undoneAt: null,
  };
}

export function isWithinRetention(createdAt: string, retentionDays = ACTIVITY_LOG_RETENTION_DAYS): boolean {
  const created = new Date(createdAt).getTime();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

export function filterRetainedEntries(entries: ActivityLogEntry[]): ActivityLogEntry[] {
  return entries.filter((entry) => isWithinRetention(entry.createdAt));
}

export function summarizeActivityLog(entries: ActivityLogEntry[]): {
  undoableCount: number;
  totalCount: number;
} {
  const retained = filterRetainedEntries(entries);
  return {
    undoableCount: retained.filter((entry) => entry.undoneAt === null).length,
    totalCount: retained.length,
  };
}

export function formatActivityTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return String(value);
}

/**
 * Builds human-readable field diffs for update actions.
 */
export function buildFieldChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: Array<{ key: string; label: string }>,
): ActivityFieldChange[] {
  const changes: ActivityFieldChange[] = [];

  fields.forEach(({ key, label }) => {
    const beforeValue = formatFieldValue(before[key]);
    const afterValue = formatFieldValue(after[key]);

    if (beforeValue !== afterValue) {
      changes.push({
        field: label,
        before: beforeValue,
        after: afterValue,
      });
    }
  });

  return changes;
}

export function pruneExpiredEntries(entries: ActivityLogEntry[]): ActivityLogEntry[] {
  return entries.filter((entry) => isWithinRetention(entry.createdAt));
}
