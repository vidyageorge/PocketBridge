import * as XLSX from 'xlsx';
import { normalizeKey, parseAmount, parseDateValue, parseDescription, parseOptionalText } from '@/lib/parseUtils';
import type {
  ProcurementColumnFilters,
  ProcurementMonthFilter,
  ProcurementRecord,
  ProcurementSummary,
  ProcurementYearFilter,
} from '@/types/procurement';

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

export function parseProcurementSheetName(sheetName: string): { month: number; year: number } | null {
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

function getProcurementField(row: Record<string, unknown>, ...keys: string[]): unknown {
  const entries = Object.entries(row).map(([key, value]) => [normalizeKey(key), value] as const);

  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    const match = entries.find(([entryKey]) => entryKey.includes(normalizedKey));
    if (match && match[1] !== '' && match[1] !== null && match[1] !== undefined) {
      return match[1];
    }
  }

  return '';
}

function parseProcurementRow(
  row: Record<string, unknown>,
  period: { month: number; year: number },
  nextId: number,
): ProcurementRecord | null {
  const description = parseDescription(getProcurementField(row, 'descripction', 'description'));
  const amount = parseAmount(getProcurementField(row, 'amount'));

  if (!description && amount === null) {
    return null;
  }

  return {
    id: nextId,
    sheetMonth: period.month,
    sheetYear: period.year,
    sno: parseOptionalText(getProcurementField(row, 'sno')) ?? '',
    orderDate: parseDateValue(getProcurementField(row, 'order date', 'orderdate')) ?? '',
    description: description ?? '—',
    supplier: parseOptionalText(getProcurementField(row, 'supplier name', 'supplier')) ?? '—',
    billDate: parseDateValue(getProcurementField(row, 'bill date', 'billdate')) ?? '',
    deliveryDate: parseDateValue(getProcurementField(row, 'delivery date', 'deliverydate')) ?? '',
    project: parseOptionalText(getProcurementField(row, 'for project', 'project')) ?? '—',
    invoiceNumber: parseOptionalText(getProcurementField(row, 'invoice number', 'invoice')) ?? '',
    amount: amount ?? 0,
    orderedBy: parseOptionalText(getProcurementField(row, 'ordered placed by', 'ordered')) ?? '',
    paymentStatus:
      parseOptionalText(getProcurementField(row, 'payment status', 'paymentstatus')) ?? '—',
    paymentDate: parseDateValue(getProcurementField(row, 'payment date', 'paymentdate')) ?? '',
    paymentMode: parseOptionalText(getProcurementField(row, 'payment mode')) ?? '',
  };
}

export function parseProcurementWorkbook(buffer: ArrayBuffer): ProcurementRecord[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
  const records: ProcurementRecord[] = [];
  let nextId = 1;

  for (const sheetName of workbook.SheetNames) {
    const period = parseProcurementSheetName(sheetName);
    if (!period) {
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    let headerRowIndex = -1;

    for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex += 1) {
      const row = rawRows[rowIndex];
      if (!Array.isArray(row)) {
        continue;
      }

      const line = row.map((cell) => normalizeKey(String(cell))).join('|');
      if (line.includes('orderdate') && line.includes('amount')) {
        headerRowIndex = rowIndex;
        break;
      }
    }

    if (headerRowIndex < 0) {
      continue;
    }

    const dataRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      range: headerRowIndex,
      defval: '',
    });

    dataRows.forEach((row) => {
      const parsed = parseProcurementRow(row, period, nextId);
      if (!parsed) {
        return;
      }
      records.push(parsed);
      nextId += 1;
    });
  }

  return reassignProcurementIds(records);
}

function reassignProcurementIds(records: ProcurementRecord[]): ProcurementRecord[] {
  return records.map((record, index) => ({ ...record, id: index + 1 }));
}

export const PROCUREMENT_BLANK_FILTER = '__blank__';

const PROCUREMENT_DROPDOWN_FILTER_FIELDS = new Set<keyof ProcurementColumnFilters>([
  'sno',
  'orderDate',
  'supplier',
  'billDate',
  'deliveryDate',
  'project',
  'invoiceNumber',
  'orderedBy',
  'paymentStatus',
  'paymentDate',
]);

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
  if (filter === PROCUREMENT_BLANK_FILTER) {
    return !value.trim();
  }
  return value.trim().toLowerCase() === filter.trim().toLowerCase();
}

function matchesColumnField(
  value: string,
  filter: string,
  field: keyof ProcurementColumnFilters,
): boolean {
  if (PROCUREMENT_DROPDOWN_FILTER_FIELDS.has(field)) {
    return matchesDropdownField(value, filter);
  }
  return matchesTextField(value, filter);
}

export function getProcurementFieldValue(
  record: ProcurementRecord,
  field: keyof ProcurementColumnFilters,
): string {
  switch (field) {
    case 'sno':
      return record.sno || String(record.id);
    case 'orderDate':
      return record.orderDate;
    case 'description':
      return record.description;
    case 'supplier':
      return record.supplier;
    case 'billDate':
      return record.billDate;
    case 'deliveryDate':
      return record.deliveryDate;
    case 'project':
      return record.project;
    case 'invoiceNumber':
      return record.invoiceNumber;
    case 'amount':
      return String(record.amount);
    case 'orderedBy':
      return record.orderedBy;
    case 'paymentStatus':
      return record.paymentStatus;
    case 'paymentDate':
      return record.paymentDate;
    default:
      return '';
  }
}

export function getProcurementColumnOptions(
  records: ProcurementRecord[],
  field: keyof ProcurementColumnFilters,
): string[] {
  const values = new Set<string>();
  for (const record of records) {
    values.add(getProcurementFieldValue(record, field).trim());
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

export function applyProcurementColumnFilters(
  records: ProcurementRecord[],
  filters: ProcurementColumnFilters,
): ProcurementRecord[] {
  return records.filter((record) => {
    const fields = Object.keys(filters) as (keyof ProcurementColumnFilters)[];
    return fields.every((field) =>
      matchesColumnField(getProcurementFieldValue(record, field), filters[field], field),
    );
  });
}

export function sortProcurementByOrderDateDesc(records: ProcurementRecord[]): ProcurementRecord[] {
  return [...records].sort((left, right) => {
    const leftDate = left.orderDate || '';
    const rightDate = right.orderDate || '';

    if (!leftDate && !rightDate) {
      return 0;
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

export function filterProcurementRecords(
  records: ProcurementRecord[],
  month: ProcurementMonthFilter,
  year: ProcurementYearFilter,
): ProcurementRecord[] {
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

export function computeProcurementSummary(records: ProcurementRecord[]): ProcurementSummary {
  return records.reduce(
    (summary, record) => {
      summary.orderCount += 1;
      summary.totalAmount += record.amount;

      const isCompleted = record.paymentStatus.toLowerCase().includes('completed');
      if (isCompleted) {
        summary.completedCount += 1;
        summary.paidAmount += record.amount;
      } else {
        summary.pendingCount += 1;
        summary.pendingAmount += record.amount;
      }

      return summary;
    },
    {
      orderCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      completedCount: 0,
      pendingCount: 0,
    },
  );
}

export function getLatestProcurementPeriod(records: ProcurementRecord[]): {
  month: number;
  year: number;
} {
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

export function getLatestMonthForYear(
  records: ProcurementRecord[],
  year: number,
): number {
  const months = getProcurementMonthsForYear(records, year);
  return months[months.length - 1] ?? 1;
}

export function getProcurementYears(records: ProcurementRecord[]): number[] {
  const years = new Set(records.map((record) => record.sheetYear));
  return Array.from(years).sort((left, right) => right - left);
}

export function getProcurementMonthsForYear(
  records: ProcurementRecord[],
  year: ProcurementYearFilter,
): number[] {
  const months = new Set(
    records
      .filter((record) => year === 'all' || record.sheetYear === year)
      .map((record) => record.sheetMonth),
  );
  return Array.from(months).sort((left, right) => left - right);
}
