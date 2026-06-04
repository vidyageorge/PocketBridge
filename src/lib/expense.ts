import * as XLSX from 'xlsx';
import { parseAmount, parseDescription } from '@/lib/parseUtils';
import type {
  EmployeeExpenseRecord,
  EmployeeMonthlySummary,
  ExpenseData,
  ExpenseSummary,
  ProjectExpenseRecord,
  ProjectMonthlySummary,
} from '@/types/expense';

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

type SheetPeriod = { month: number; year: number };

type ColumnMapping = {
  projects: { col: number; code: string }[];
  employees: { col: number; name: string }[];
};

function parseSummarySheetName(sheetName: string): SheetPeriod | null {
  const cleaned = sheetName.trim().toLowerCase().replace(/\s+/g, '');

  for (const [name, month] of Object.entries(MONTH_NAME_TO_NUMBER)) {
    if (cleaned.startsWith(name)) {
      const yearMatch = cleaned.match(/(\d{2,4})$/);
      let year = yearMatch ? Number(yearMatch[1]) : 2025;
      if (year < 100) {
        year += 2000;
      }
      return { month, year };
    }
  }

  return null;
}

function shouldSkipDescription(description: string): boolean {
  const upper = description.toUpperCase();
  return (
    !description ||
    upper.includes('INDUVIDUAL TOTAL') ||
    upper.startsWith('RUNNING BALANCE') ||
    upper.includes('OPENING BALANCE')
  );
}

function readColumnMapping(subHeaderRow: unknown[]): ColumnMapping {
  const projects = [4, 5, 6]
    .map((col) => ({
      col,
      code: String(subHeaderRow[col] ?? '').trim(),
    }))
    .filter((entry) => entry.code);

  const employees = [7, 8, 9, 10, 11]
    .map((col) => ({
      col,
      name: String(subHeaderRow[col] ?? '').trim(),
    }))
    .filter((entry) => entry.name);

  return { projects, employees };
}

function parseSummarySheet(
  sheetName: string,
  rows: unknown[][],
  period: SheetPeriod,
  nextProjectId: { value: number },
  nextEmployeeId: { value: number },
): { project: ProjectExpenseRecord[]; employee: EmployeeExpenseRecord[] } {
  const project: ProjectExpenseRecord[] = [];
  const employee: EmployeeExpenseRecord[] = [];
  const mapping = readColumnMapping(rows[2] ?? []);

  for (let rowIndex = 4; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const description = parseDescription(row[1]) ?? '';
    if (shouldSkipDescription(description)) {
      continue;
    }

    const sno = typeof row[0] === 'number' ? String(row[0]) : '';
    const income = parseAmount(row[2]) ?? 0;
    const companyExpense = parseAmount(row[3]) ?? 0;
    const cumulativeTotal = typeof row[12] === 'number' ? row[12] : 0;

    if (companyExpense > 0) {
      project.push({
        id: nextProjectId.value++,
        sheetMonth: period.month,
        sheetYear: period.year,
        sheetName: sheetName.trim(),
        sno,
        description,
        projectCode: 'Company',
        paymentDate: '',
        amount: companyExpense,
        income,
        cumulativeTotal,
      });
    }

    for (const projectColumn of mapping.projects) {
      const amount = parseAmount(row[projectColumn.col]) ?? 0;
      if (amount <= 0) {
        continue;
      }

      project.push({
        id: nextProjectId.value++,
        sheetMonth: period.month,
        sheetYear: period.year,
        sheetName: sheetName.trim(),
        sno,
        description,
        projectCode: projectColumn.code,
        paymentDate: '',
        amount,
        income: 0,
        cumulativeTotal,
      });
    }

    for (const employeeColumn of mapping.employees) {
      const amount = parseAmount(row[employeeColumn.col]) ?? 0;
      if (amount <= 0) {
        continue;
      }

      employee.push({
        id: nextEmployeeId.value++,
        sheetMonth: period.month,
        sheetYear: period.year,
        sheetName: sheetName.trim(),
        sno,
        description,
        employeeName: employeeColumn.name,
        paymentDate: '',
        amount,
        cumulativeTotal,
      });
    }
  }

  return { project, employee };
}

export function parseExpenseWorkbook(buffer: ArrayBuffer): ExpenseData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
  const project: ProjectExpenseRecord[] = [];
  const employee: EmployeeExpenseRecord[] = [];
  const seenPeriods = new Set<string>();
  const nextProjectId = { value: 1 };
  const nextEmployeeId = { value: 1 };

  for (const sheetName of workbook.SheetNames) {
    const period = parseSummarySheetName(sheetName);
    if (!period) {
      continue;
    }

    const periodKey = `${period.month}-${period.year}`;
    if (seenPeriods.has(periodKey)) {
      continue;
    }
    seenPeriods.add(periodKey);

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const parsed = parseSummarySheet(sheetName, rows, period, nextProjectId, nextEmployeeId);
    project.push(...parsed.project);
    employee.push(...parsed.employee);
  }

  return { project, employee };
}

type PeriodRecord = { sheetMonth: number; sheetYear: number };

export function filterByPeriod<T extends PeriodRecord>(
  records: T[],
  month: number,
  year: number,
): T[] {
  return records.filter((record) => record.sheetMonth === month && record.sheetYear === year);
}

export function computeExpenseSummary(records: { amount: number }[]): ExpenseSummary {
  return records.reduce(
    (summary, record) => {
      summary.lineCount += 1;
      summary.totalAmount += record.amount;
      return summary;
    },
    { lineCount: 0, totalAmount: 0 },
  );
}

export function getLatestExpensePeriod(records: PeriodRecord[]): { month: number; year: number } {
  if (records.length === 0) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  const latest = records.reduce((currentLatest, record) => {
    if (record.sheetYear > currentLatest.sheetYear) {
      return record;
    }
    if (record.sheetYear === currentLatest.sheetYear && record.sheetMonth > currentLatest.sheetMonth) {
      return record;
    }
    return currentLatest;
  }, records[0]);

  return { month: latest.sheetMonth, year: latest.sheetYear };
}

export function getExpenseYears(records: PeriodRecord[]): number[] {
  return [...new Set(records.map((record) => record.sheetYear))].sort((left, right) => right - left);
}

export function getExpenseMonthsForYear(records: PeriodRecord[], year: number): number[] {
  return [
    ...new Set(
      records.filter((record) => record.sheetYear === year).map((record) => record.sheetMonth),
    ),
  ].sort((left, right) => left - right);
}

export function getLatestMonthForYear(records: PeriodRecord[], year: number): number {
  const months = getExpenseMonthsForYear(records, year);
  return months[months.length - 1] ?? 1;
}

export function getProjectCodes(records: ProjectExpenseRecord[]): string[] {
  return [...new Set(records.map((record) => record.projectCode))].sort();
}

export function getEmployeeNames(records: EmployeeExpenseRecord[]): string[] {
  return [...new Set(records.map((record) => record.employeeName))].sort();
}

export function filterProjectByCode(
  records: ProjectExpenseRecord[],
  projectCode: string,
): ProjectExpenseRecord[] {
  if (projectCode === 'all') {
    return records;
  }
  return records.filter((record) => record.projectCode === projectCode);
}

export function filterEmployeeByName(
  records: EmployeeExpenseRecord[],
  employeeName: string,
): EmployeeExpenseRecord[] {
  if (employeeName === 'all') {
    return records;
  }
  return records.filter((record) => record.employeeName === employeeName);
}

type EmployeeExpenseCategory = 'salary' | 'advance';

/**
 * Maps a workbook description to salary or advance; everything else counts toward total only.
 */
export function categorizeEmployeeExpense(description: string): EmployeeExpenseCategory | 'other' {
  const normalized = description.toLowerCase();

  if (normalized.includes('advance')) {
    return 'advance';
  }

  if (
    normalized.includes('salary') ||
    normalized.includes('bonus') ||
    normalized.includes('incentive') ||
    normalized.includes('insentive')
  ) {
    return 'salary';
  }

  return 'other';
}

/**
 * Builds one row per employee for a month with salary, advance, and total spent.
 */
export function aggregateEmployeeMonthlySummary(
  records: EmployeeExpenseRecord[],
): EmployeeMonthlySummary[] {
  const byEmployee = new Map<string, EmployeeMonthlySummary>();

  for (const record of records) {
    const name = record.employeeName.trim() || 'Unknown';
    const existing = byEmployee.get(name) ?? {
      employeeName: name,
      salary: 0,
      advance: 0,
      totalSpent: 0,
    };

    const category = categorizeEmployeeExpense(record.description);
    if (category === 'salary') {
      existing.salary += record.amount;
    } else if (category === 'advance') {
      existing.advance += record.amount;
    }

    existing.totalSpent += record.amount;
    byEmployee.set(name, existing);
  }

  return [...byEmployee.values()].sort((left, right) =>
    left.employeeName.localeCompare(right.employeeName),
  );
}

const MONTH_SHORT_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUNE',
  'JULY',
  'AUG',
  'SEPT',
  'OCT',
  'NOV',
  'DEC',
] as const;

/**
 * Builds sheet label used in the expense workbook (e.g. JUNE-25).
 */
export function formatExpenseSheetName(month: number, year: number): string {
  const monthLabel = MONTH_SHORT_NAMES[month - 1] ?? 'MON';
  const yearSuffix = String(year).slice(-2);
  return `${monthLabel}-${yearSuffix}`;
}

/**
 * Default payment date for manual entry (today if same period, else first of month).
 */
export function defaultExpensePaymentDate(month: number, year: number): string {
  const now = new Date();
  if (now.getMonth() + 1 === month && now.getFullYear() === year) {
    return now.toISOString().slice(0, 10);
  }
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function getNextEmployeeExpenseId(records: EmployeeExpenseRecord[]): number {
  if (records.length === 0) {
    return 1;
  }
  return Math.max(...records.map((record) => record.id)) + 1;
}

export function getNextProjectExpenseId(records: ProjectExpenseRecord[]): number {
  if (records.length === 0) {
    return 1;
  }
  return Math.max(...records.map((record) => record.id)) + 1;
}

/** @deprecated Use defaultExpensePaymentDate */
export const defaultEmployeePaymentDate = defaultExpensePaymentDate;

/**
 * Builds one row per project code for a month with spend and income totals.
 */
export function aggregateProjectMonthlySummary(
  records: ProjectExpenseRecord[],
): ProjectMonthlySummary[] {
  const byProject = new Map<string, ProjectMonthlySummary>();

  for (const record of records) {
    const code = record.projectCode.trim() || 'Unassigned';
    const existing = byProject.get(code) ?? {
      projectCode: code,
      totalSpent: 0,
      totalIncome: 0,
    };

    existing.totalSpent += record.amount;
    existing.totalIncome += record.income;
    byProject.set(code, existing);
  }

  return [...byProject.values()].sort((left, right) =>
    left.projectCode.localeCompare(right.projectCode),
  );
}
