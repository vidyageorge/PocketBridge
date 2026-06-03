import * as XLSX from 'xlsx';
import { normalizeKey, parseAmount, parseDateValue, parseOptionalText } from '@/lib/parseUtils';
import type {
  ClientPaymentColumnFilters,
  ClientPaymentRecord,
  ClientPaymentSummary,
  ClientProjectMeta,
} from '@/types/clientPayment';

export const CLIENT_PAYMENT_BLANK_FILTER = '__blank__';

const CLIENT_PAYMENT_DROPDOWN_FIELDS = new Set<keyof ClientPaymentColumnFilters>([
  'sno',
  'paymentDate',
  'description',
  'invoiceNumber',
  'comment',
]);

function parseSheetMetadata(
  rows: unknown[][],
  sheetName: string,
): Pick<ClientPaymentRecord, 'projectCode' | 'projectName' | 'clientName'> {
  let projectCode = sheetName;
  let projectName = '';
  let clientName = '';

  for (const row of rows.slice(0, 6)) {
    const firstCell = String(row[0] ?? '');
    const thirdCell = String(row[2] ?? '').trim();

    if (firstCell.includes('PROJECT CODE') && thirdCell) {
      projectCode = thirdCell;
    }
    if (firstCell.startsWith('PROJECT NAME')) {
      projectName = firstCell.replace(/^PROJECT NAME:\s*/i, '').trim();
    }
    if (firstCell.startsWith('CLIENT')) {
      clientName = firstCell.replace(/^CLIENT\s*:\s*/i, '').trim();
    }
  }

  return { projectCode, projectName, clientName };
}

function hasSplitAmountColumns(rows: unknown[][], headerRowIndex: number): boolean {
  const subHeaderRow = rows[headerRowIndex + 1];
  if (!subHeaderRow) {
    return false;
  }
  const amountLabel = normalizeKey(String(subHeaderRow[3] ?? ''));
  return amountLabel.includes('banking') || amountLabel.includes('cash');
}

function resolvePaymentAmounts(
  row: unknown[],
  splitAmountColumns: boolean,
): Pick<ClientPaymentRecord, 'banking' | 'cash' | 'gpay' | 'amount'> {
  if (splitAmountColumns) {
    const banking = parseAmount(row[3]) ?? 0;
    const cash = parseAmount(row[4]) ?? 0;
    const gpay = parseAmount(row[5]) ?? 0;
    const runningTotal = parseAmount(row[6]) ?? 0;
    const remarkValue = parseAmount(row[9]) ?? 0;

    let amount = banking + cash + gpay;
    if (amount === 0 && runningTotal > 0) {
      amount = runningTotal;
    }
    if (amount === 0 && remarkValue > 0) {
      amount = remarkValue;
    }

    return { banking, cash, gpay, amount };
  }

  const amount = parseAmount(row[3]) ?? 0;
  return { banking: amount, cash: 0, gpay: 0, amount };
}

function parseClientPaymentRow(
  row: unknown[],
  sheetName: string,
  metadata: Pick<ClientPaymentRecord, 'projectCode' | 'projectName' | 'clientName'>,
  splitAmountColumns: boolean,
  nextId: number,
): ClientPaymentRecord | null {
  if (typeof row[0] !== 'number') {
    return null;
  }

  const description = parseOptionalText(row[2]) ?? '';
  const amounts = resolvePaymentAmounts(row, splitAmountColumns);

  if (!description && amounts.amount === 0) {
    return null;
  }

  return {
    id: nextId,
    sheetProject: sheetName,
    projectCode: metadata.projectCode,
    projectName: metadata.projectName,
    clientName: metadata.clientName,
    sno: String(row[0]),
    paymentDate: parseDateValue(row[1]) ?? '',
    description: description || '—',
    banking: amounts.banking,
    cash: amounts.cash,
    gpay: amounts.gpay,
    amount: amounts.amount,
    invoiceNumber: parseOptionalText(row[7]) ?? '',
    remarkDate: parseDateValue(row[8]) ?? '',
    remarkValue: parseAmount(row[9]) ?? 0,
    comment: parseOptionalText(row[10]) ?? '',
  };
}

export function parseClientPaymentWorkbook(buffer: ArrayBuffer): ClientPaymentRecord[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
  const records: ClientPaymentRecord[] = [];
  let nextId = 1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const metadata = parseSheetMetadata(rows, sheetName);
    const headerRowIndex = rows.findIndex((row) => normalizeKey(String(row[0] ?? '')) === 'sno');

    if (headerRowIndex < 0) {
      continue;
    }

    const splitAmountColumns = hasSplitAmountColumns(rows, headerRowIndex);
    const dataStartIndex = headerRowIndex + (splitAmountColumns ? 2 : 1);

    for (let rowIndex = dataStartIndex; rowIndex < rows.length; rowIndex += 1) {
      const parsed = parseClientPaymentRow(
        rows[rowIndex],
        sheetName,
        metadata,
        splitAmountColumns,
        nextId,
      );
      if (parsed) {
        records.push(parsed);
        nextId += 1;
      }
    }
  }

  return records.map((record, index) => ({ ...record, id: index + 1 }));
}

function matchesTextField(value: string, filter: string): boolean {
  if (!filter.trim()) {
    return true;
  }
  return value.toLowerCase().includes(filter.trim().toLowerCase());
}

function matchesDropdownField(value: string, filter: string): boolean {
  if (!filter.trim()) {
    return true;
  }
  if (filter === CLIENT_PAYMENT_BLANK_FILTER) {
    return !value.trim();
  }
  return value.trim().toLowerCase() === filter.trim().toLowerCase();
}

function matchesColumnField(
  value: string,
  filter: string,
  field: keyof ClientPaymentColumnFilters,
): boolean {
  if (CLIENT_PAYMENT_DROPDOWN_FIELDS.has(field)) {
    return matchesDropdownField(value, filter);
  }
  return matchesTextField(value, filter);
}

export function getClientPaymentFieldValue(
  record: ClientPaymentRecord,
  field: keyof ClientPaymentColumnFilters,
): string {
  switch (field) {
    case 'sno':
      return record.sno;
    case 'paymentDate':
      return record.paymentDate;
    case 'description':
      return record.description;
    case 'banking':
      return record.banking > 0 ? String(record.banking) : '';
    case 'cash':
      return record.cash > 0 ? String(record.cash) : '';
    case 'gpay':
      return record.gpay > 0 ? String(record.gpay) : '';
    case 'amount':
      return String(record.amount);
    case 'invoiceNumber':
      return record.invoiceNumber;
    case 'comment':
      return record.comment;
    default:
      return '';
  }
}

export function getClientPaymentColumnOptions(
  records: ClientPaymentRecord[],
  field: keyof ClientPaymentColumnFilters,
): string[] {
  const values = new Set<string>();
  for (const record of records) {
    values.add(getClientPaymentFieldValue(record, field).trim());
  }

  return [...values].sort((left, right) => {
    if (!left && right) {
      return 1;
    }
    if (left && !right) {
      return -1;
    }
    return left.localeCompare(right);
  });
}

export function applyClientPaymentColumnFilters(
  records: ClientPaymentRecord[],
  filters: ClientPaymentColumnFilters,
): ClientPaymentRecord[] {
  return records.filter((record) => {
    const fields = Object.keys(filters) as (keyof ClientPaymentColumnFilters)[];
    return fields.every((field) =>
      matchesColumnField(getClientPaymentFieldValue(record, field), filters[field], field),
    );
  });
}

export function filterClientPaymentsByProject(
  records: ClientPaymentRecord[],
  sheetProject: string,
): ClientPaymentRecord[] {
  return records.filter((record) => record.sheetProject === sheetProject);
}

export function sortClientPaymentsByDateDesc(records: ClientPaymentRecord[]): ClientPaymentRecord[] {
  return [...records].sort((left, right) => {
    const leftDate = left.paymentDate || '';
    const rightDate = right.paymentDate || '';

    if (!leftDate && !rightDate) {
      return Number(right.sno) - Number(left.sno);
    }
    if (!leftDate) {
      return 1;
    }
    if (!rightDate) {
      return -1;
    }

    return rightDate.localeCompare(leftDate);
  });
}

export function computeClientPaymentSummary(records: ClientPaymentRecord[]): ClientPaymentSummary {
  return records.reduce(
    (summary, record) => {
      summary.paymentCount += 1;
      summary.totalAmount += record.amount;
      summary.totalBanking += record.banking;
      summary.totalCash += record.cash;
      summary.totalGpay += record.gpay;
      return summary;
    },
    {
      paymentCount: 0,
      totalAmount: 0,
      totalBanking: 0,
      totalCash: 0,
      totalGpay: 0,
    },
  );
}

export function getClientProjectList(records: ClientPaymentRecord[]): ClientProjectMeta[] {
  const projects = new Map<string, ClientProjectMeta>();

  for (const record of records) {
    if (!projects.has(record.sheetProject)) {
      projects.set(record.sheetProject, {
        sheetProject: record.sheetProject,
        projectCode: record.projectCode,
        projectName: record.projectName,
        clientName: record.clientName,
      });
    }
  }

  return [...projects.values()].sort((left, right) =>
    left.sheetProject.localeCompare(right.sheetProject),
  );
}

export function getDefaultClientProject(records: ClientPaymentRecord[]): string {
  const projects = getClientProjectList(records);
  return projects[0]?.sheetProject ?? 'P-01';
}

export function getClientProjectMeta(
  records: ClientPaymentRecord[],
  sheetProject: string,
): ClientProjectMeta | null {
  const record = records.find((entry) => entry.sheetProject === sheetProject);
  if (!record) {
    return null;
  }

  return {
    sheetProject: record.sheetProject,
    projectCode: record.projectCode,
    projectName: record.projectName,
    clientName: record.clientName,
  };
}
