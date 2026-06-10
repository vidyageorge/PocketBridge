import type { ClientPaymentRecord } from '@/types/clientPayment';
import type { Transaction } from '@/types/transaction';

function classifyCashEntry(description: string): 'income' | 'expense' {
  const normalized = description.toLowerCase();

  if (
    /payment received|advance payment|token advance|order confirmation|client payment|from .+ sir/.test(
      normalized,
    )
  ) {
    return 'income';
  }

  return 'expense';
}

function extractSpentBy(description: string): string | undefined {
  const patterns = [
    /(?:cash\s+)?paid\s+to\s+([^/-]+)/i,
    /cash\s+given\s+to\s+([^/-]+)/i,
    /given\s+to\s+([^/-]+)/i,
    /gpay\s+to\s+([^/-]+)/i,
    /cash\s+at\s+([^/-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    const name = match?.[1]?.trim();
    if (name) {
      return name;
    }
  }

  return undefined;
}

export function isInferredCashTransaction(transaction: Transaction): boolean {
  return transaction.source === 'cash' && /^\[[^\]]+\]/.test(transaction.desc);
}

/**
 * Rebuilds inferred cash ledger lines from project payment records, keeping manual cash entries.
 */
export function syncCashTransactionsFromClientPayments(
  records: ClientPaymentRecord[],
  existingTransactions: Transaction[],
): Transaction[] {
  const preserved = existingTransactions.filter(
    (transaction) => transaction.source !== 'cash' || !isInferredCashTransaction(transaction),
  );
  const inferred = buildCashTransactionsFromClientPayments(records, preserved);
  return [...inferred, ...preserved];
}

/**
 * Converts client-payment workbook rows with a Cash amount into petty-cash ledger lines.
 */
export function buildCashTransactionsFromClientPayments(
  records: ClientPaymentRecord[],
  existingTransactions: Transaction[],
): Transaction[] {
  const existingKeys = new Set(
    existingTransactions
      .filter((transaction) => transaction.source === 'cash')
      .map(
        (transaction) =>
          `${transaction.date}|${transaction.desc}|${transaction.amount}|${transaction.clientName ?? ''}`,
      ),
  );

  const imported: Transaction[] = [];
  let nextId =
    existingTransactions.length === 0
      ? 1
      : Math.max(...existingTransactions.map((transaction) => transaction.id)) + 1;

  const cashRecords = records
    .filter((record) => record.cash > 0 && record.paymentDate)
    .sort((left, right) => left.paymentDate.localeCompare(right.paymentDate));

  for (const record of cashRecords) {
    const type = classifyCashEntry(record.description);
    const amount = record.cash;
    const desc = `[${record.sheetProject}] ${record.description}`;
    const duplicateKey = `${record.paymentDate}|${desc}|${amount}|${type === 'income' ? record.clientName : ''}`;

    if (existingKeys.has(duplicateKey)) {
      continue;
    }

    imported.push({
      id: nextId++,
      date: record.paymentDate,
      desc,
      clientName: type === 'income' ? record.clientName : undefined,
      spentBy: type === 'expense' ? extractSpentBy(record.description) : undefined,
      cat: type === 'income' ? 'Client Payment' : 'Materials',
      type,
      amount,
      source: 'cash',
    });
    existingKeys.add(duplicateKey);
  }

  return imported;
}
