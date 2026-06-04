import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');
const workbookPath = join(rootDirectory, 'support_files', 'Client -Projects Payment.xlsx');
const seedPath = join(rootDirectory, 'src', 'data', 'client-payment-seed.json');

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseAmount(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(numeric) ? numeric : null;
}

function parseDateValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const text = String(value).trim();
  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    let year = Number(slashMatch[3]);
    if (year < 100) {
      year += 2000;
    }
    return `${year}-${month}-${day}`;
  }

  return null;
}

function parseOptionalText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function parseSheetMetadata(rows, sheetName) {
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

function hasSplitAmountColumns(rows, headerRowIndex) {
  const subHeaderRow = rows[headerRowIndex + 1];
  if (!subHeaderRow) {
    return false;
  }
  const amountLabel = normalizeKey(String(subHeaderRow[3] ?? ''));
  return amountLabel.includes('banking') || amountLabel.includes('cash');
}

function resolvePaymentAmounts(row, splitAmountColumns) {
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

function parseClientPaymentRow(row, sheetName, metadata, splitAmountColumns, nextId) {
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

function parseClientPaymentWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
  const records = [];
  let nextId = 1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
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

const buffer = readFileSync(workbookPath);
const records = parseClientPaymentWorkbook(buffer);
writeFileSync(seedPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

const projects = new Set(records.map((record) => record.sheetProject));
const clients = new Set(records.map((record) => record.clientName.trim()).filter(Boolean));
console.log(`Wrote ${records.length} client payment rows to ${seedPath}`);
console.log(`Projects: ${projects.size} — ${[...projects].join(', ')}`);
console.log(`Clients: ${clients.size}`);
