import * as XLSX from 'xlsx';
import {
  getFieldValue,
  isCreditIndicator,
  isDebitIndicator,
  normalizeKey,
  parseAmount,
  parseDateValue,
  parseDescription,
  parseOptionalText,
} from '@/lib/parseUtils';
import type { BankStatementEntry, BankStatementPreview, TransactionType } from '@/types/transaction';

const TRAN_DATE_KEYS = [
  'trandate',
  'date',
  'transactiondate',
  'txndate',
  'postdate',
  'transaction date',
  'txn date',
];

const VALUE_DATE_KEYS = ['valuedate', 'value date'];

const DESCRIPTION_KEYS = [
  'particulars',
  'narration',
  'description',
  'remarks',
  'details',
  'transactiondetails',
  'transactionparticulars',
  'txndetails',
  'payee',
  'beneficiary',
  'reference',
  'memo',
  'paymentdetails',
];

const LOCATION_KEYS = ['location'];

const CHQ_KEYS = ['chqno', 'chq', 'chequeno', 'chequenumber'];

const MODE_KEYS = ['mode'];

const DEBIT_KEYS = [
  'withdrawals',
  'withdrawal',
  'debit',
  'withdrawalamt',
  'withdrawalamount',
  'debitamount',
  'dr',
  'amountdebited',
  'paidout',
  'debitinr',
  'withdrawalinr',
  'moneyout',
  'paid',
];

const CREDIT_KEYS = [
  'deposits',
  'deposit',
  'credit',
  'depositamt',
  'depositamount',
  'creditamount',
  'cr',
  'amountcredited',
  'creditinr',
  'depositinr',
  'moneyin',
];

const BALANCE_KEYS = ['balance', 'balanceinr', 'closingbalance', 'runningbalance'];

const TYPE_KEYS = ['type', 'drcr', 'debitcredit', 'transactiontype', 'crdr'];

const SKIP_COLUMN_KEYS = [
  'serial',
  'sno',
  'srno',
  'referenceno',
  'refno',
];

function findHeaderRow(rawRows: unknown[][]): number {
  for (let rowIndex = 0; rowIndex < Math.min(rawRows.length, 60); rowIndex += 1) {
    const row = rawRows[rowIndex];
    if (!Array.isArray(row)) {
      continue;
    }

    const normalizedCells = row.map((cell) => normalizeKey(String(cell ?? '')));
    const hasDate = normalizedCells.some((cell) =>
      TRAN_DATE_KEYS.some((key) => cell.includes(normalizeKey(key))),
    );
    const hasDebit = normalizedCells.some((cell) =>
      DEBIT_KEYS.some((key) => cell.includes(normalizeKey(key))),
    );
    const hasCredit = normalizedCells.some((cell) =>
      CREDIT_KEYS.some((key) => cell.includes(normalizeKey(key))),
    );
    const hasDescription = normalizedCells.some((cell) =>
      DESCRIPTION_KEYS.some((key) => cell.includes(normalizeKey(key))),
    );

    if (hasDate && (hasDebit || hasCredit || hasDescription)) {
      return rowIndex;
    }
  }

  return 0;
}

function parseSheet(sheet: XLSX.WorkSheet): BankStatementPreview {
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const headerRowIndex = findHeaderRow(rawRows);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerRowIndex,
    defval: '',
  });

  return extractTransactionsFromStatement(rows);
}

export async function parseBankStatementFile(file: File): Promise<BankStatementPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: false,
    raw: true,
  });

  let bestResult: BankStatementPreview = {
    entries: [],
    skipped: [],
    detectedColumns: {
      tranDate: 'Not detected',
      valueDate: 'Not detected',
      description: 'Not detected',
      location: 'Not detected',
      chqNo: 'Not detected',
      debit: 'Not detected',
      credit: 'Not detected',
      balance: 'Not detected',
    },
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const result = parseSheet(sheet);
    if (result.entries.length > bestResult.entries.length) {
      bestResult = result;
    }
  }

  return bestResult;
}

function inferDescriptionFromRow(row: Record<string, unknown>): string | null {
  const fromKnownColumn = parseDescription(getFieldValue(row, ...DESCRIPTION_KEYS));
  if (fromKnownColumn) {
    return fromKnownColumn;
  }

  let longest = '';

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeKey(key);
    if (SKIP_COLUMN_KEYS.some((skipKey) => normalizedKey.includes(skipKey))) {
      continue;
    }
    if (TRAN_DATE_KEYS.some((dateKey) => normalizedKey.includes(normalizeKey(dateKey)))) {
      continue;
    }
    if (VALUE_DATE_KEYS.some((dateKey) => normalizedKey.includes(normalizeKey(dateKey)))) {
      continue;
    }
    if (DEBIT_KEYS.some((debitKey) => normalizedKey.includes(normalizeKey(debitKey)))) {
      continue;
    }
    if (CREDIT_KEYS.some((creditKey) => normalizedKey.includes(normalizeKey(creditKey)))) {
      continue;
    }
    if (BALANCE_KEYS.some((balanceKey) => normalizedKey.includes(normalizeKey(balanceKey)))) {
      continue;
    }
    if (LOCATION_KEYS.some((locationKey) => normalizedKey.includes(normalizeKey(locationKey)))) {
      continue;
    }
    if (CHQ_KEYS.some((chqKey) => normalizedKey.includes(normalizeKey(chqKey)))) {
      continue;
    }

    const text = parseDescription(value);
    if (text && text.length > longest.length) {
      longest = text;
    }
  }

  return longest.length > 0 ? longest : null;
}

function inferAmountsFromRow(row: Record<string, unknown>): {
  debitAmount: number | null;
  creditAmount: number | null;
} {
  let debitAmount = parseAmount(getFieldValue(row, ...DEBIT_KEYS));
  let creditAmount = parseAmount(getFieldValue(row, ...CREDIT_KEYS));

  if (debitAmount !== null || creditAmount !== null) {
    return { debitAmount, creditAmount };
  }

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeKey(key);
    if (SKIP_COLUMN_KEYS.some((skipKey) => normalizedKey.includes(skipKey))) {
      continue;
    }

    const amount = parseAmount(value);
    if (amount === null) {
      continue;
    }

    if (DEBIT_KEYS.some((debitKey) => normalizedKey.includes(normalizeKey(debitKey)))) {
      debitAmount = amount;
    } else if (CREDIT_KEYS.some((creditKey) => normalizedKey.includes(normalizeKey(creditKey)))) {
      creditAmount = amount;
    }
  }

  return { debitAmount, creditAmount };
}

function extractStatementFields(row: Record<string, unknown>) {
  const tranDate =
    parseDateValue(getFieldValue(row, ...TRAN_DATE_KEYS)) ??
    parseDateValue(getFieldValue(row, ...VALUE_DATE_KEYS));
  const valueDate = parseDateValue(getFieldValue(row, ...VALUE_DATE_KEYS));

  return {
    date: tranDate,
    valueDate: valueDate && valueDate !== tranDate ? valueDate : undefined,
    description: inferDescriptionFromRow(row),
    location: parseOptionalText(getFieldValue(row, ...LOCATION_KEYS)),
    chqNo: parseOptionalText(getFieldValue(row, ...CHQ_KEYS)),
    mode: parseOptionalText(getFieldValue(row, ...MODE_KEYS)),
    balance: parseAmount(getFieldValue(row, ...BALANCE_KEYS)) ?? undefined,
    ...inferAmountsFromRow(row),
  };
}

function extractTransactionsFromStatement(
  rows: Record<string, unknown>[],
): BankStatementPreview {
  const entries: BankStatementEntry[] = [];
  const skipped: BankStatementPreview['skipped'] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const fields = extractStatementFields(row);
    const typeIndicator = getFieldValue(row, ...TYPE_KEYS);
    const rawAmount = getFieldValue(
      row,
      'amount',
      'transaction amount',
      'txn amount',
      'transactionamount',
    );
    const singleAmount = parseAmount(rawAmount);

    if (
      !fields.date &&
      !fields.description &&
      fields.debitAmount === null &&
      fields.creditAmount === null &&
      singleAmount === null
    ) {
      return;
    }

    if (fields.description && /^b\/f$/i.test(fields.description.trim())) {
      return;
    }

    const parsed = resolveStatementEntry({
      date: fields.date,
      valueDate: fields.valueDate,
      description: fields.description,
      location: fields.location,
      chqNo: fields.chqNo,
      mode: fields.mode,
      balance: fields.balance,
      debitAmount: fields.debitAmount,
      creditAmount: fields.creditAmount,
      singleAmount,
      rawAmount,
      typeIndicator,
      rowNumber,
    });

    if ('skipped' in parsed) {
      if (parsed.skipped.reason !== 'Empty row') {
        skipped.push(parsed.skipped);
      }
      return;
    }

    entries.push(parsed.entry);
  });

  const firstRow = rows[0] ?? {};
  const detectedColumns = {
    tranDate: findDetectedColumn(firstRow, TRAN_DATE_KEYS),
    valueDate: findDetectedColumn(firstRow, VALUE_DATE_KEYS),
    description: findDetectedColumn(firstRow, DESCRIPTION_KEYS),
    location: findDetectedColumn(firstRow, LOCATION_KEYS),
    chqNo: findDetectedColumn(firstRow, CHQ_KEYS),
    debit: findDetectedColumn(firstRow, DEBIT_KEYS),
    credit: findDetectedColumn(firstRow, CREDIT_KEYS),
    balance: findDetectedColumn(firstRow, BALANCE_KEYS),
  };

  return { entries, skipped, detectedColumns };
}

function resolveStatementEntry(input: {
  date: string | null;
  valueDate?: string;
  description: string | null;
  location?: string;
  chqNo?: string;
  mode?: string;
  balance?: number;
  debitAmount: number | null;
  creditAmount: number | null;
  singleAmount: number | null;
  rawAmount: unknown;
  typeIndicator: unknown;
  rowNumber: number;
}):
  | { entry: BankStatementEntry }
  | { skipped: { row: number; reason: string } } {
  const {
    date,
    valueDate,
    description,
    location,
    chqNo,
    mode,
    balance,
    debitAmount,
    creditAmount,
    singleAmount,
    rawAmount,
    typeIndicator,
    rowNumber,
  } = input;

  if (debitAmount !== null && creditAmount !== null && debitAmount > 0 && creditAmount > 0) {
    return { skipped: { row: rowNumber, reason: 'Row has both debit and credit amounts' } };
  }

  let amount: number | null = null;
  let type: TransactionType | null = null;
  let withdrawal: number | undefined;
  let deposit: number | undefined;

  if (debitAmount !== null && debitAmount > 0) {
    amount = debitAmount;
    type = 'expense';
    withdrawal = debitAmount;
  } else if (creditAmount !== null && creditAmount > 0) {
    amount = creditAmount;
    type = 'income';
    deposit = creditAmount;
  } else if (singleAmount !== null && isDebitIndicator(typeIndicator)) {
    amount = singleAmount;
    type = 'expense';
    withdrawal = singleAmount;
  } else if (singleAmount !== null && isCreditIndicator(typeIndicator)) {
    amount = singleAmount;
    type = 'income';
    deposit = singleAmount;
  } else if (singleAmount !== null && !typeIndicator) {
    if (typeof rawAmount === 'number' && rawAmount < 0) {
      amount = Math.abs(rawAmount);
      type = 'expense';
      withdrawal = amount;
    } else if (typeof rawAmount === 'string' && rawAmount.trim().startsWith('-')) {
      amount = singleAmount;
      type = 'expense';
      withdrawal = singleAmount;
    } else if (typeof rawAmount === 'number' && rawAmount > 0) {
      amount = rawAmount;
      type = 'income';
      deposit = amount;
    } else if (typeof rawAmount === 'string' && rawAmount.trim().length > 0) {
      amount = singleAmount;
      type = 'income';
      deposit = singleAmount;
    }
  }

  if (amount === null || type === null) {
    if (date || description) {
      return { skipped: { row: rowNumber, reason: 'No debit or credit amount found on this row' } };
    }
    return { skipped: { row: rowNumber, reason: 'Empty row' } };
  }

  if (!date) {
    return { skipped: { row: rowNumber, reason: 'Transaction found but date is missing or invalid' } };
  }

  if (!description) {
    return { skipped: { row: rowNumber, reason: 'Transaction found but description is missing' } };
  }

  return {
    entry: {
      date,
      valueDate,
      description,
      location,
      chqNo,
      mode,
      withdrawal,
      deposit,
      balance,
      amount,
      type,
    },
  };
}

function findDetectedColumn(row: Record<string, unknown>, keys: string[]): string {
  for (const key of Object.keys(row)) {
    const normalized = normalizeKey(key);
    if (keys.some((candidate) => normalized.includes(normalizeKey(candidate)))) {
      return key;
    }
  }
  return 'Not detected';
}
