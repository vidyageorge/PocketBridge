import expenseSeed from '@/data/expense-seed.json';
import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { EmployeeExpenseRecord, ExpenseData, ProjectExpenseRecord } from '@/types/expense';

function normalizeEmployeeRecords(records: EmployeeExpenseRecord[]): EmployeeExpenseRecord[] {
  return records.map((record) => ({
    ...record,
    paymentDate: record.paymentDate ?? '',
  }));
}

function normalizeProjectRecords(records: ProjectExpenseRecord[]): ProjectExpenseRecord[] {
  return records.map((record) => ({
    ...record,
    paymentDate: record.paymentDate ?? '',
  }));
}

function normalizeExpenseData(data: ExpenseData): ExpenseData {
  return {
    project: normalizeProjectRecords(data.project ?? []),
    employee: normalizeEmployeeRecords(data.employee ?? []),
  };
}

export const EXPENSE_STORAGE_KEY = STORE_KEYS.EXPENSES;

export function loadExpenseData(): ExpenseData {
  const parsed = getCachedStoreValue<ExpenseData | null>(STORE_KEYS.EXPENSES, null);

  if (!parsed || (!parsed.project?.length && !parsed.employee?.length)) {
    return seedExpenseData();
  }

  return normalizeExpenseData(parsed);
}

export function saveExpenseData(data: ExpenseData): void {
  setCachedStoreValue(STORE_KEYS.EXPENSES, normalizeExpenseData(data));
}

export function seedExpenseData(): ExpenseData {
  const seeded = normalizeExpenseData(expenseSeed as ExpenseData);
  saveExpenseData(seeded);
  return seeded;
}
