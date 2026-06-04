import { MONTHS } from '@/lib/constants';
import { getExpensesByCategory, filterTransactions } from '@/lib/filters';
import type { ClientPaymentRecord } from '@/types/clientPayment';
import type { EmployeeExpenseRecord, ProjectExpenseRecord } from '@/types/expense';
import type { ProcurementRecord } from '@/types/procurement';
import type { MonthFilter, Transaction, YearFilter } from '@/types/transaction';

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

export type PortfolioCounts = {
  projectCount: number;
  clientCount: number;
  employeeCount: number;
};

/**
 * Counts distinct projects, clients, and employees across all loaded data.
 */
export function getPortfolioCounts(
  clientPayments: ClientPaymentRecord[],
  projectExpenses: ProjectExpenseRecord[],
  employeeExpenses: EmployeeExpenseRecord[],
): PortfolioCounts {
  const projects = new Set<string>();

  for (const record of clientPayments) {
    if (record.sheetProject) {
      projects.add(record.sheetProject);
    }
  }

  for (const record of projectExpenses) {
    if (record.projectCode.trim()) {
      projects.add(record.projectCode.trim());
    }
  }

  const clients = new Set(
    clientPayments.map((record) => record.clientName.trim()).filter((name) => name.length > 0),
  );

  const employees = new Set(
    employeeExpenses.map((record) => record.employeeName.trim()).filter((name) => name.length > 0),
  );

  return {
    projectCount: projects.size,
    clientCount: clients.size,
    employeeCount: employees.size,
  };
}

export type TopSpendingArea = {
  label: string;
  amount: number;
  source: string;
};

/**
 * Finds the single largest spending bucket for the period (bank/cash, purchases, projects, or payroll).
 */
export function getTopSpendingArea(
  transactions: Transaction[],
  procurement: ProcurementRecord[],
  projectExpenses: ProjectExpenseRecord[],
  employeeExpenses: EmployeeExpenseRecord[],
  month: MonthFilter,
  year: YearFilter,
): TopSpendingArea | null {
  const candidates: TopSpendingArea[] = [];

  const bankCashCategories = getExpensesByCategory(
    filterTransactions(transactions, month, year),
  );
  if (bankCashCategories[0]) {
    candidates.push({
      label: bankCashCategories[0].category,
      amount: bankCashCategories[0].amount,
      source: 'Bank & cash',
    });
  }

  const topSupplier = aggregateAmountByLabel(
    procurement.map((record) => ({ label: record.supplier, amount: record.amount })),
    1,
  )[0];
  if (topSupplier) {
    candidates.push({
      label: topSupplier.label,
      amount: topSupplier.amount,
      source: 'Purchases',
    });
  }

  const topProject = aggregateAmountByLabel(
    projectExpenses.map((record) => ({
      label: record.projectCode || 'Project costs',
      amount: record.amount,
    })),
    1,
  )[0];
  if (topProject) {
    candidates.push({
      label: topProject.label,
      amount: topProject.amount,
      source: 'Project costs',
    });
  }

  const payrollTotal = employeeExpenses.reduce((sum, record) => sum + record.amount, 0);
  if (payrollTotal > 0) {
    candidates.push({
      label: 'Team salaries',
      amount: payrollTotal,
      source: 'Payroll',
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((left, right) => right.amount - left.amount)[0];
}

export type MonthlyMoneyFlow = {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
};

function formatMonthYearLabel(month: number, year: number): string {
  const monthName = MONTHS.find((entry) => entry.value === month)?.label ?? String(month);
  return `${monthName} ${year}`;
}

/**
 * Groups bank and cash transactions into monthly income and expense totals.
 */
export function getMonthlyIncomeAndSpend(
  transactions: Transaction[],
  year: YearFilter,
): MonthlyMoneyFlow[] {
  const buckets = new Map<string, MonthlyMoneyFlow>();

  for (const transaction of transactions) {
    const [yearPart, monthPart] = transaction.date.split('-').map(Number);
    if (!yearPart || !monthPart) {
      continue;
    }
    if (year !== 'all' && yearPart !== year) {
      continue;
    }

    const monthKey = `${yearPart}-${String(monthPart).padStart(2, '0')}`;
    const existing = buckets.get(monthKey) ?? {
      monthKey,
      label: formatMonthYearLabel(monthPart, yearPart),
      income: 0,
      expense: 0,
    };

    if (transaction.type === 'income') {
      existing.income += transaction.amount;
    } else {
      existing.expense += transaction.amount;
    }

    buckets.set(monthKey, existing);
  }

  return [...buckets.values()].sort((left, right) =>
    right.monthKey.localeCompare(left.monthKey),
  );
}
