import { parseAmount } from '@/lib/parseUtils';
import type { StatementBalanceSummary } from '@/types/accountBalance';

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

function parseAsOnDateFromText(text: string): string | null {
  const match = text.match(/as\s+on\s+([A-Za-z]+)\s+(\d{1,2})[,\s]+(\d{4})/i);
  if (!match) {
    return null;
  }

  const month = MONTH_NAME_TO_NUMBER[match[1].toLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3]);

  if (!month || !Number.isFinite(day) || !Number.isFinite(year)) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseBalanceWithCreditSuffix(text: string): number | null {
  const match = text.match(/([\d,]+\.\d{2})\s*Cr/i);
  if (!match) {
    return null;
  }
  return parseAmount(match[1]);
}

/**
 * Reads ICICI "Summary of Accounts" balance and as-on date from statement text.
 */
export function parseIciciSummaryFromText(text: string): StatementBalanceSummary | undefined {
  const asOnDate = parseAsOnDateFromText(text);
  if (!asOnDate) {
    return undefined;
  }

  const summarySection = text.split(/Statement of transactions/i)[0] ?? text;

  const operativeBalance = summarySection.match(
    /Balance\s*\(INR\)[\s\S]{0,400}?([\d,]+\.\d{2})\s*Cr/i,
  )?.[1];
  const parsedOperativeBalance = parseAmount(operativeBalance);
  if (parsedOperativeBalance) {
    return { asOnDate, balance: parsedOperativeBalance };
  }

  const currentAccountBalance = summarySection.match(
    /Current[\s\S]{0,220}?([\d,]+\.\d{2})\s*Cr/i,
  )?.[1];
  const parsedCurrentBalance = parseAmount(currentAccountBalance);
  if (parsedCurrentBalance) {
    return { asOnDate, balance: parsedCurrentBalance };
  }

  const totalBalance = parseBalanceWithCreditSuffix(
    summarySection.match(/Total\s+Balance[\s\S]{0,80}/i)?.[0] ?? '',
  );
  if (totalBalance) {
    return { asOnDate, balance: totalBalance };
  }

  return undefined;
}

/**
 * Reads ICICI CSV/Excel preamble rows for account summary balance.
 */
export function parseIciciSummaryFromRows(rawRows: unknown[][]): StatementBalanceSummary | undefined {
  let asOnLine = '';

  for (const row of rawRows.slice(0, 30)) {
    const line = Array.isArray(row)
      ? row.map((cell) => String(cell ?? '')).join(',')
      : String(row ?? '');

    if (/as\s+on/i.test(line)) {
      asOnLine = line;
    }

    if (/current\s*a\/c/i.test(line.toLowerCase())) {
      const parts = line.split(',');
      const balance = parseAmount(parts[1]);
      const asOnDate = parseAsOnDateFromText(asOnLine || line);
      if (balance && asOnDate) {
        return { asOnDate, balance };
      }
    }
  }

  return undefined;
}
