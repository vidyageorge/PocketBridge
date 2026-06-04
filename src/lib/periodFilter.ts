import { getLatestProcurementPeriod } from '@/lib/procurement';
import type { ClientPaymentRecord } from '@/types/clientPayment';
import type { EmployeeExpenseRecord, ProjectExpenseRecord } from '@/types/expense';
import type { ProcurementRecord } from '@/types/procurement';
import type { Transaction, YearFilter } from '@/types/transaction';

function addYearFromDate(years: Set<number>, date: string): void {
  const yearPart = Number(date.split('-')[0]);
  if (Number.isFinite(yearPart) && yearPart > 1900) {
    years.add(yearPart);
  }
}

/**
 * Collects years present across bank/cash, procurement sheets, expenses, and client payments.
 */
export function getAvailablePeriodYears(
  transactions: Transaction[],
  procurement: ProcurementRecord[],
  projectExpenses: ProjectExpenseRecord[],
  employeeExpenses: EmployeeExpenseRecord[],
  clientPayments: ClientPaymentRecord[],
): number[] {
  const years = new Set<number>();

  for (const transaction of transactions) {
    addYearFromDate(years, transaction.date);
  }

  for (const record of procurement) {
    years.add(record.sheetYear);
  }

  for (const record of projectExpenses) {
    years.add(record.sheetYear);
  }

  for (const record of employeeExpenses) {
    years.add(record.sheetYear);
  }

  for (const record of clientPayments) {
    addYearFromDate(years, record.paymentDate);
  }

  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }

  return [...years].sort((left, right) => right - left);
}

/**
 * Picks the best default dashboard year (latest year with procurement, else latest overall).
 */
export function getPreferredDashboardYear(
  transactions: Transaction[],
  procurement: ProcurementRecord[],
  projectExpenses: ProjectExpenseRecord[],
  employeeExpenses: EmployeeExpenseRecord[],
  clientPayments: ClientPaymentRecord[],
): number {
  if (procurement.length > 0) {
    return getLatestProcurementPeriod(procurement).year;
  }

  const years = getAvailablePeriodYears(
    transactions,
    procurement,
    projectExpenses,
    employeeExpenses,
    clientPayments,
  );
  return years[0] ?? new Date().getFullYear();
}

export function yearHasProcurementData(
  procurement: ProcurementRecord[],
  year: YearFilter,
): boolean {
  if (year === 'all') {
    return procurement.length > 0;
  }
  return procurement.some((record) => record.sheetYear === year);
}
