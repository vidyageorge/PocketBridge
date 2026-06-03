export function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function formatLocalDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDateValue(value: unknown): string | null {
  if (typeof value === 'number') {
    return xlsxDateToIso(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const dayFirstMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dayFirstMatch) {
      const [, dayPart, monthPart, yearPart] = dayFirstMatch;
      return formatLocalDate(Number(yearPart), Number(monthPart), Number(dayPart));
    }

    const shortYearMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
    if (shortYearMatch) {
      const [, dayPart, monthPart, shortYear] = shortYearMatch;
      const year = Number(shortYear) > 50 ? `19${shortYear}` : `20${shortYear}`;
      return formatLocalDate(Number(year), Number(monthPart), Number(dayPart));
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  return null;
}

function xlsxDateToIso(serial: number): string | null {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.abs(value);
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[₹,\s]/g, '');
    if (cleaned === '' || cleaned === '-') {
      return null;
    }
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.abs(parsed);
    }
  }

  return null;
}

export function getFieldValue(row: Record<string, unknown>, ...keys: string[]): unknown {
  const normalizedEntries = Object.entries(row).map(
    ([key, value]) => [normalizeKey(key), value] as const,
  );

  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    const match = normalizedEntries.find(([entryKey]) => entryKey === normalizedKey);
    if (match && match[1] !== '' && match[1] !== null && match[1] !== undefined) {
      return match[1];
    }
  }

  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    const match = normalizedEntries.find(([entryKey]) => entryKey.includes(normalizedKey));
    if (match && match[1] !== '' && match[1] !== null && match[1] !== undefined) {
      return match[1];
    }
  }

  return undefined;
}

export function parseOptionalText(value: unknown): string | undefined {
  const text = parseDescription(value);
  return text ?? undefined;
}

export function parseDescription(value: unknown): string | null {
  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

export function isDebitIndicator(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return ['dr', 'debit', 'd', 'withdrawal', 'paid'].includes(normalized);
}

export function isCreditIndicator(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return ['cr', 'credit', 'c', 'deposit'].includes(normalized);
}
