import * as XLSX from 'xlsx';
import { parseAmount, parseDescription } from '@/lib/parseUtils';
import type {
  EmployeeExpenseRecord,
  ExpenseData,
  ExpenseSummary,
  ProjectExpenseRecord,
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
