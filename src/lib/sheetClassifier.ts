import * as XLSX from 'xlsx';
import { normalizeKey } from '@/lib/parseUtils';

export type WorkbookSheetType = 'client_payment' | 'procurement' | 'expense' | 'unknown';

export type ClassifiedSheet = {
  sheetName: string;
  type: WorkbookSheetType;
};

function hasClientPaymentLayout(rows: unknown[][]): boolean {
  return rows.some((row) => normalizeKey(String(row[0] ?? '')) === 'sno');
}

function hasProcurementLayout(rows: unknown[][]): boolean {
  return rows.some((row) => {
    if (!Array.isArray(row)) {
      return false;
    }
    const line = row.map((cell) => normalizeKey(String(cell))).join('|');
    return line.includes('orderdate') && line.includes('supplier');
  });
}

function hasExpenseLayout(rows: unknown[][]): boolean {
  return rows.some((row) => {
    if (!Array.isArray(row)) {
      return false;
    }
    const line = row.map((cell) => normalizeKey(String(cell))).join('|');
    return (
      line.includes('employeeexpanse') ||
      line.includes('projectsexpanse') ||
      line.includes('companyexpanse')
    );
  });
}

export function classifySheet(_sheetName: string, sheet: XLSX.WorkSheet): WorkbookSheetType {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  if (hasClientPaymentLayout(rows)) {
    return 'client_payment';
  }

  if (hasProcurementLayout(rows)) {
    return 'procurement';
  }

  if (hasExpenseLayout(rows)) {
    return 'expense';
  }

  return 'unknown';
}

export function classifyWorkbookSheets(workbook: XLSX.WorkBook): ClassifiedSheet[] {
  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return { sheetName, type: 'unknown' as const };
    }
    return { sheetName, type: classifySheet(sheetName, sheet) };
  });
}
