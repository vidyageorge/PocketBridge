import {
  CATEGORIES,
  EMPLOYEE_EXPENSE_CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PROCUREMENT_PAYMENT_STATUSES,
} from '@/lib/constants';
import type { CustomOptionListKey, CustomOptionsData } from '@/types/customOptions';

const DEFAULT_OPTIONS: Record<CustomOptionListKey, readonly string[]> = {
  expenseCategories: EXPENSE_CATEGORIES,
  incomeCategories: INCOME_CATEGORIES,
  bankCategories: CATEGORIES,
  procurementPaymentStatuses: PROCUREMENT_PAYMENT_STATUSES,
  employeeExpenseCategories: EMPLOYEE_EXPENSE_CATEGORIES,
  paymentModes: ['Cash', 'UPI', 'Cheque', 'NEFT', 'RTGS'],
  projectCodes: ['P-01', 'P-02', 'P-03', 'P-04', 'Company'],
  employeeNames: [],
};

/**
 * Merges built-in defaults with user-added options (deduped, sorted).
 */
export function mergeOptionList(
  key: CustomOptionListKey,
  custom: CustomOptionsData,
  extraDefaults: string[] = [],
): string[] {
  const base = [...DEFAULT_OPTIONS[key], ...extraDefaults];
  const added = custom[key] ?? [];

  return [...new Set([...base, ...added].map((entry) => entry.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right),
  );
}

/**
 * Validates and returns an updated store when adding a new option label.
 */
export function appendCustomOption(
  custom: CustomOptionsData,
  key: CustomOptionListKey,
  label: string,
  extraDefaults: string[] = [],
): { next: CustomOptionsData; error: string | null } {
  const trimmed = label.trim();
  if (!trimmed) {
    return { next: custom, error: 'Enter a name.' };
  }

  const existing = mergeOptionList(key, custom, extraDefaults);
  if (existing.some((entry) => entry.toLowerCase() === trimmed.toLowerCase())) {
    return { next: custom, error: 'This option already exists.' };
  }

  const currentAdded = custom[key] ?? [];
  return {
    next: {
      ...custom,
      [key]: [...currentAdded, trimmed],
    },
    error: null,
  };
}
