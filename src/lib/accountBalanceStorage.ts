import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { AccountBalanceSnapshot } from '@/types/accountBalance';

export const ACCOUNT_BALANCE_STORAGE_KEY = STORE_KEYS.ACCOUNT_BALANCES;

export function loadAccountBalanceSnapshots(): AccountBalanceSnapshot[] {
  const stored = getCachedStoreValue<AccountBalanceSnapshot[] | null>(
    STORE_KEYS.ACCOUNT_BALANCES,
    null,
  );
  return Array.isArray(stored) ? stored : [];
}

export function saveAccountBalanceSnapshots(snapshots: AccountBalanceSnapshot[]): void {
  setCachedStoreValue(STORE_KEYS.ACCOUNT_BALANCES, snapshots);
}

export function upsertAccountBalanceSnapshot(
  snapshots: AccountBalanceSnapshot[],
  nextSnapshot: AccountBalanceSnapshot,
): AccountBalanceSnapshot[] {
  const withoutSameMonth = snapshots.filter((snapshot) => {
    const [existingYear, existingMonth] = snapshot.asOnDate.split('-').map(Number);
    const [nextYear, nextMonth] = nextSnapshot.asOnDate.split('-').map(Number);
    return !(existingYear === nextYear && existingMonth === nextMonth);
  });

  return [...withoutSameMonth, nextSnapshot].sort((left, right) =>
    right.asOnDate.localeCompare(left.asOnDate),
  );
}
