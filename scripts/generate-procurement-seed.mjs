import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');
const workbookPath = join(rootDirectory, 'support_files', '02-Procurement Data.xlsx');
const seedPath = join(rootDirectory, 'src', 'data', 'procurement-seed.json');

const MONTH_NAME_TO_NUMBER = {
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

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseProcurementSheetName(sheetName) {
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

function parseAmount(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateValue(value) {
  if (!value) {
    return '';
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return '';
}

function parseOptionalText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function parseDescription(value) {
  const text = parseOptionalText(value);
  return text;
}

function getProcurementField(row, ...keys) {
  const entries = Object.entries(row).map(([key, value]) => [normalizeKey(key), value]);

  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    const match = entries.find(([entryKey]) => entryKey.includes(normalizedKey));
    if (match && match[1] !== '' && match[1] !== null && match[1] !== undefined) {
      return match[1];
    }
  }

  return '';
}

function parseProcurementRow(row, period, nextId) {
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

function parseProcurementWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
  const records = [];
  let nextId = 1;

  for (const rawSheetName of workbook.SheetNames) {
    const sheetName = rawSheetName.trim();
    const period = parseProcurementSheetName(sheetName);
    if (!period) {
      continue;
    }

    const sheet = workbook.Sheets[rawSheetName];
    if (!sheet) {
      continue;
    }

    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
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

    const dataRows = XLSX.utils.sheet_to_json(sheet, {
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

  return records.map((record, index) => ({ ...record, id: index + 1 }));
}

const buffer = readFileSync(workbookPath);
const records = parseProcurementWorkbook(buffer);
writeFileSync(seedPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

const suppliers = new Set(records.map((record) => record.supplier));
console.log(`Wrote ${records.length} procurement rows to ${seedPath}`);
console.log(`Unique suppliers: ${suppliers.size}`);
