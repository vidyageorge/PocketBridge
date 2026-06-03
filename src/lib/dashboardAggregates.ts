import type { ClientPaymentRecord } from '@/types/clientPayment';
import type { ProcurementRecord } from '@/types/procurement';
import type { MonthFilter, YearFilter } from '@/types/transaction';

export type DashboardBreakdownRow = {
  label: string;
  amount: number;
  count: number;
};

type SheetPeriodRecord = { sheetMonth: number; sheetYear: number };

/**
 * Filters workbook-backed records (procurement, expense) using the shared period filter.
 */
export function filterBySheetPeriod<T extends SheetPeriodRecord>(
  records: T[],
  month: MonthFilter,
  year: YearFilter,
): T[] {
  return records.filter((record) => {
    if (year !== 'all' && record.sheetYear !== year) {
      return false;
    }
    if (month !== 'all' && record.sheetMonth !== month) {
      return false;
    }
    return true;
  });
}

/**
 * Filters client payment rows by payment date (YYYY-MM-DD).
 */
export function filterClientPaymentsByPeriod(
  records: ClientPaymentRecord[],
  month: MonthFilter,
  year: YearFilter,
): ClientPaymentRecord[] {
  return records.filter((record) => {
    if (!record.paymentDate) {
      return month === 'all' && year === 'all';
    }

    const [yearPart, monthPart] = record.paymentDate.split('-').map(Number);
    if (year !== 'all' && yearPart !== year) {
      return false;
    }
    if (month !== 'all' && monthPart !== month) {
      return false;
    }
    return true;
  });
}

/**
 * Groups numeric rows by label and returns the top entries by total amount.
 */
export function aggregateAmountByLabel(
  rows: { label: string; amount: number }[],
  limit = 8,
): DashboardBreakdownRow[] {
  const totals = new Map<string, { amount: number; count: number }>();

  for (const row of rows) {
    const label = row.label.trim() || '—';
    const current = totals.get(label) ?? { amount: 0, count: 0 };
    current.amount += row.amount;
    current.count += 1;
    totals.set(label, current);
  }

  return [...totals.entries()]
    .map(([label, { amount, count }]) => ({ label, amount, count }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, limit);
}

/**
 * Splits procurement spend into completed vs pending buckets for charts.
 */
export function getProcurementPaymentStatusBreakdown(
  records: ProcurementRecord[],
): DashboardBreakdownRow[] {
  const completed = { label: 'Completed', amount: 0, count: 0 };
  const pending = { label: 'Pending / other', amount: 0, count: 0 };

  for (const record of records) {
    const isCompleted = record.paymentStatus.toLowerCase().includes('completed');
    const bucket = isCompleted ? completed : pending;
    bucket.amount += record.amount;
    bucket.count += 1;
  }

  return [completed, pending].filter((row) => row.count > 0);
}

/**
 * Returns unique client names with at least one payment in the filtered set.
 */
export function countUniqueClients(records: ClientPaymentRecord[]): number {
  const clients = new Set(
    records.map((record) => record.clientName.trim() || record.sheetProject).filter(Boolean),
  );
  return clients.size;
}
