import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { ActivityLogEntry } from '@/types/activityLog';

export function loadActivityLogEntries(): ActivityLogEntry[] {
  return getCachedStoreValue<ActivityLogEntry[]>(STORE_KEYS.ACTIVITY_LOG, []);
}

export function saveActivityLogEntries(entries: ActivityLogEntry[]): ActivityLogEntry[] {
  return setCachedStoreValue(STORE_KEYS.ACTIVITY_LOG, entries);
}
