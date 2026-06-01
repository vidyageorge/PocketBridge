import * as XLSX from 'xlsx';
import {
  getFieldValue,
  isCreditIndicator,
  isDebitIndicator,
  normalizeKey,
  parseAmount,
  parseDateValue,
  parseDescription,
} from '@/lib/parseUtils';
import type { BankStatementEntry, BankStatementPreview, TransactionType } from '@/types/transaction';

const DATE_KEYS = [
  'date',
  'transactiondate',
  'txndate',
  'valuedate',
  'postdate',
  'transaction date',
  'value date',
  'txn date',
];

const DESCRIPTION_KEYS = [
  'narration',
  'description',
  'particulars',
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

const DEBIT_KEYS = [
  'debit',
  'withdrawal',
  'withdrawalamt',
  'withdrawalamount',
  'debitamount',
  'dr',
  'amountdebited',
  'paidout',
  'withdrawals',
  'debitinr',
  'withdrawalinr',
  'moneyout',
  'paid',
];

const CREDIT_KEYS = [
  'credit',
  'deposit',
  'depositamt',
  'depositamount',
  'creditamount',
  'cr',
  'amountcredited',
  'deposits',
  'creditinr',
  'depositinr',
  'moneyin',
];

const TYPE_KEYS = ['type', 'drcr', 'drcr', 'debitcredit', 'transactiontype', 'crdr'];

const SKIP_COLUMN_KEYS = [
  'balance',
  'closingbalance',
  'runningbalance',
  'availablebalance',
  'chq',
  'cheque',
  'referenceno',
  'refno',
  'serial',
  'sno',
  'srno',
];

function findHeaderRow(rawRows: unknown[][]): number {
  for (let rowIndex = 0; rowIndex < Math.min(rawRows.length, 60); rowIndex += 1) {
    const row = rawRows[rowIndex];
    if (!Array.isArray(row)) {
      continue;
    }

    const normalizedCells = row.map((cell) => normalizeKey(String(cell ?? '')));
    const hasDate = normalizedCells.some((cell) =>
      DATE_KEYS.some((key) => cell.includes(normalizeKey(key))),
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
    const hasAmount = normalizedCells.some(
      (cell) => cell === 'amount' || cell.includes('amount') || cell.includes('amt'),
    );

    if (hasDate && (hasDebit || hasCredit || hasAmount || hasDescription)) {
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
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });

  let bestResult: BankStatementPreview = {
    entries: [],
    skipped: [],
    detectedColumns: {
      date: 'Not detected',
      description: 'Not detected',
      debit: 'Not detected',
      credit: 'Not detected',
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
    if (DATE_KEYS.some((dateKey) => normalizedKey.includes(normalizeKey(dateKey)))) {
      continue;
    }
    if (DEBIT_KEYS.some((debitKey) => normalizedKey.includes(normalizeKey(debitKey)))) {
      continue;
    }
    if (CREDIT_KEYS.some((creditKey) => normalizedKey.includes(normalizeKey(creditKey)))) {
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

function extractTransactionsFromStatement(
  rows: Record<string, unknown>[],
): BankStatementPreview {
  const entries: BankStatementEntry[] = [];
  const skipped: BankStatementPreview['skipped'] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const date = parseDateValue(getFieldValue(row, ...DATE_KEYS));
    const description = inferDescriptionFromRow(row);
    const { debitAmount, creditAmount } = inferAmountsFromRow(row);
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
      !date &&
      !description &&
      debitAmount === null &&
      creditAmount === null &&
      singleAmount === null
    ) {
      return;
    }

    const parsed = resolveStatementEntry({
      date,
      description,
      debitAmount,
      creditAmount,
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
    date: findDetectedColumn(firstRow, DATE_KEYS),
    description: findDetectedColumn(firstRow, DESCRIPTION_KEYS),
    debit: findDetectedColumn(firstRow, DEBIT_KEYS),
    credit: findDetectedColumn(firstRow, CREDIT_KEYS),
  };

  return { entries, skipped, detectedColumns };
}

function resolveStatementEntry(input: {
  date: string | null;
  description: string | null;
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
    description,
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

  if (debitAmount !== null && debitAmount > 0) {
    amount = debitAmount;
    type = 'expense';
  } else if (creditAmount !== null && creditAmount > 0) {
    amount = creditAmount;
    type = 'income';
  } else if (singleAmount !== null && isDebitIndicator(typeIndicator)) {
    amount = singleAmount;
    type = 'expense';
  } else if (singleAmount !== null && isCreditIndicator(typeIndicator)) {
    amount = singleAmount;
    type = 'income';
  } else if (singleAmount !== null && !typeIndicator) {
    if (typeof rawAmount === 'number' && rawAmount < 0) {
      amount = Math.abs(rawAmount);
      type = 'expense';
    } else if (typeof rawAmount === 'string' && rawAmount.trim().startsWith('-')) {
      amount = singleAmount;
      type = 'expense';
    } else if (typeof rawAmount === 'number' && rawAmount > 0) {
      amount = rawAmount;
      type = 'income';
    } else if (typeof rawAmount === 'string' && rawAmount.trim().length > 0) {
      amount = singleAmount;
      type = 'income';
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
    entry: { date, description, amount, type },
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
