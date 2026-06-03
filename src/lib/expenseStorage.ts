import expenseSeed from '@/data/expense-seed.json';
import type { ExpenseData } from '@/types/expense';

export const EXPENSE_STORAGE_KEY = 'pocketbridge_expenses';

export function loadExpenseData(): ExpenseData {
  try {
    const stored = localStorage.getItem(EXPENSE_STORAGE_KEY);
    if (!stored) {
      return seedExpenseData();
    }

    const parsed = JSON.parse(stored) as ExpenseData;
    if (!parsed.project?.length && !parsed.employee?.length) {
      return seedExpenseData();
    }

    return parsed;
  } catch {
    return seedExpenseData();
  }
}

export function saveExpenseData(data: ExpenseData): void {
  localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(data));
}

export function seedExpenseData(): ExpenseData {
  const seeded = expenseSeed as ExpenseData;
  saveExpenseData(seeded);
  return seeded;
}
