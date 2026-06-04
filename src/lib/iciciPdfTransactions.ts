import { parseAmount } from '@/lib/parseUtils';
import type { BankStatementEntry } from '@/types/transaction';

function parseIciciDate(value: string): string | null {
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function splitDescriptionAndLocation(body: string): { description: string; location?: string } {
  const locationMatchers = [
    /\s+(CHENNAI-K\.K\.NAGAR)\s*$/,
    /\s+(RPC\s*-\s*TRICHY)\s*$/,
    /\s+(RPC\s*-\s*LUCKNOW\s*-\s*0116)\s*$/,
    /\s+(RPC-CHH\.\s*SAMBHAJINAGAR)\s*$/,
  ];

  for (const matcher of locationMatchers) {
    const match = body.match(matcher);
    if (match) {
      return {
        description: body.slice(0, match.index).trim(),
        location: match[1].trim(),
      };
    }
  }

  return { description: body.trim() };
}

function parseAmountTail(chunk: string): {
  withdrawal?: number;
  deposit?: number;
  balance: number;
  bodyWithoutAmounts: string;
} | null {
  const threeAmountMatch = chunk.match(
    /\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*Cr\s*$/i,
  );
  if (threeAmountMatch) {
    const withdrawal = parseAmount(threeAmountMatch[1]);
    const deposit = parseAmount(threeAmountMatch[2]);
    const balance = parseAmount(threeAmountMatch[3]);
    if (!withdrawal || !deposit || !balance) {
      return null;
    }

    return {
      withdrawal,
      deposit,
      balance,
      bodyWithoutAmounts: chunk.slice(0, threeAmountMatch.index).trim(),
    };
  }

  const twoAmountMatch = chunk.match(/\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*Cr\s*$/i);
  if (twoAmountMatch) {
    const withdrawal = parseAmount(twoAmountMatch[1]);
    const balance = parseAmount(twoAmountMatch[2]);
    if (!withdrawal || !balance) {
      return null;
    }

    return {
      withdrawal,
      balance,
      bodyWithoutAmounts: chunk.slice(0, twoAmountMatch.index).trim(),
    };
  }

  const openingMatch = chunk.match(/\s+([\d,]+\.\d{2})\s*Cr\s*$/i);
  if (!openingMatch) {
    return null;
  }

  const balance = parseAmount(openingMatch[1]);
  if (!balance) {
    return null;
  }

  return {
    balance,
    bodyWithoutAmounts: chunk.slice(0, openingMatch.index).trim(),
  };
}

function parseTransactionChunk(chunk: string): BankStatementEntry | null {
  const amountTail = parseAmountTail(chunk);
  if (!amountTail) {
    return null;
  }

  const broughtForwardMatch = amountTail.bodyWithoutAmounts.match(
    /^(\d{2}-\d{2}-\d{4})\s+B\/F\s+(.+)$/i,
  );
  if (broughtForwardMatch) {
    const tranDate = parseIciciDate(broughtForwardMatch[1]);
    if (!tranDate) {
      return null;
    }

    const { description, location } = splitDescriptionAndLocation(broughtForwardMatch[2]);
    return {
      date: tranDate,
      description: description || 'B/F',
      location,
      balance: amountTail.balance,
      amount: 0,
      type: 'expense',
    };
  }

  const transactionMatch = amountTail.bodyWithoutAmounts.match(
    /^(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(.+)$/,
  );
  if (!transactionMatch) {
    return null;
  }

  const tranDate = parseIciciDate(transactionMatch[1]);
  const valueDate = parseIciciDate(transactionMatch[2]);
  if (!tranDate || !valueDate) {
    return null;
  }

  const { description, location } = splitDescriptionAndLocation(transactionMatch[3]);
  if (!description) {
    return null;
  }

  const withdrawal = amountTail.withdrawal ?? 0;
  const deposit = amountTail.deposit ?? 0;
  const type: 'income' | 'expense' = deposit > 0 ? 'income' : 'expense';
  const amount = deposit > 0 ? deposit : withdrawal;

  if (amount <= 0) {
    return null;
  }

  return {
    date: tranDate,
    valueDate: valueDate !== tranDate ? valueDate : undefined,
    description,
    location,
    withdrawal: withdrawal > 0 ? withdrawal : undefined,
    deposit: deposit > 0 ? deposit : undefined,
    balance: amountTail.balance,
    amount,
    type,
  };
}

/**
 * Parses ICICI PDF statement rows from flattened statement text.
 */
function findTransactionBodyStart(cleaned: string): number {
  const broughtForwardStart = cleaned.search(/\d{2}-\d{2}-\d{4}\s+B\/F/i);
  if (broughtForwardStart >= 0) {
    return broughtForwardStart;
  }

  return cleaned.search(/\d{2}-\d{2}-\d{4}\s+\d{2}-\d{2}-\d{4}\s+/);
}

function findTransactionRowEnd(cleaned: string, start: number): number {
  const tail = cleaned.slice(start);

  if (/^\d{2}-\d{2}-\d{4}\s+B\/F/i.test(tail)) {
    const openingRow = tail.match(/^[\s\S]*?\s+[\d,]+\.\d{2}\s*Cr/i);
    return openingRow ? start + openingRow[0].length : start + tail.length;
  }

  const threeAmountRow = tail.match(
    /^[\s\S]*?\s+[\d,]+\.\d{2}\s+[\d,]+\.\d{2}\s+[\d,]+\.\d{2}\s*Cr/i,
  );
  if (threeAmountRow) {
    return start + threeAmountRow[0].length;
  }

  const twoAmountRow = tail.match(/^[\s\S]*?\s+[\d,]+\.\d{2}\s+[\d,]+\.\d{2}\s*Cr/i);
  if (twoAmountRow) {
    return start + twoAmountRow[0].length;
  }

  const openingRow = tail.match(/^[\s\S]*?\s+[\d,]+\.\d{2}\s*Cr/i);
  if (openingRow) {
    return start + openingRow[0].length;
  }

  return cleaned.length;
}

function sliceTransactionChunks(cleaned: string): string[] {
  const chunks: string[] = [];
  let searchFrom = 0;

  while (searchFrom < cleaned.length) {
    while (searchFrom < cleaned.length && /\s/.test(cleaned[searchFrom])) {
      searchFrom += 1;
    }

    if (searchFrom >= cleaned.length) {
      break;
    }

    const slice = cleaned.slice(searchFrom);
    const rowStart = slice.match(/^(\d{2}-\d{2}-\d{4})\s+(?:B\/F|\d{2}-\d{2}-\d{4})\s+/);
    if (!rowStart) {
      break;
    }

    const rowEnd = findTransactionRowEnd(cleaned, searchFrom);
    const chunk = cleaned.slice(searchFrom, rowEnd).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    searchFrom = rowEnd;
  }

  return chunks;
}

export function parseIciciTransactionsFromText(text: string): BankStatementEntry[] {
  const section = text.split(/Statement of transactions/i)[1] ?? '';
  const afterHeader = section.replace(/[\s\S]*?Balance \(INR\)\s*/i, '').trim();
  const bodyStart = findTransactionBodyStart(afterHeader);
  const cleaned = bodyStart >= 0 ? afterHeader.slice(bodyStart) : afterHeader;
  const footerIndex = cleaned.search(/\*{3}\s*End of Statement/i);
  const body = footerIndex >= 0 ? cleaned.slice(0, footerIndex) : cleaned;
  const chunks = sliceTransactionChunks(body);

  const entries: BankStatementEntry[] = [];
  for (const chunk of chunks) {
    const parsed = parseTransactionChunk(chunk);
    if (parsed && parsed.amount > 0) {
      entries.push(parsed);
    }
  }

  return entries;
}
