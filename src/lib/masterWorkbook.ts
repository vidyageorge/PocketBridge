import * as XLSX from 'xlsx';
import { parseClientPaymentFromWorkbook } from '@/lib/clientPayment';
import { parseExpenseFromWorkbook } from '@/lib/expense';
import { parseProcurementFromWorkbook } from '@/lib/procurement';
import { classifyWorkbookSheets, type WorkbookSheetType } from '@/lib/sheetClassifier';
import type { ClientPaymentRecord } from '@/types/clientPayment';
import type { ExpenseData } from '@/types/expense';
import type { ProcurementRecord } from '@/types/procurement';

export type MasterSheetImportSummary = {
  sheetName: string;
  type: WorkbookSheetType;
};

export type MasterWorkbookImportResult = {
  expenses: ExpenseData;
  procurement: ProcurementRecord[];
  clientPayments: ClientPaymentRecord[];
  sheets: MasterSheetImportSummary[];
  expenseLineCount: number;
  procurementCount: number;
  clientPaymentCount: number;
};

function groupSheetsByType(
  classified: ReturnType<typeof classifyWorkbookSheets>,
): Record<WorkbookSheetType, string[]> {
  const groups: Record<WorkbookSheetType, string[]> = {
    client_payment: [],
    procurement: [],
    expense: [],
    unknown: [],
  };

  for (const entry of classified) {
    groups[entry.type].push(entry.sheetName);
  }

  return groups;
}

export function readMasterWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
}

export function parseMasterWorkbook(buffer: ArrayBuffer): MasterWorkbookImportResult {
  const workbook = readMasterWorkbook(buffer);
  const classified = classifyWorkbookSheets(workbook);
  const groups = groupSheetsByType(classified);

  const expenses = parseExpenseFromWorkbook(workbook, groups.expense);
  const procurement = parseProcurementFromWorkbook(workbook, groups.procurement);
  const clientPayments = parseClientPaymentFromWorkbook(workbook, groups.client_payment);

  return {
    expenses,
    procurement,
    clientPayments,
    sheets: classified.filter((entry) => entry.type !== 'unknown'),
    expenseLineCount: expenses.project.length + expenses.employee.length,
    procurementCount: procurement.length,
    clientPaymentCount: clientPayments.length,
  };
}
