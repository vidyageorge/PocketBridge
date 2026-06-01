export const STORAGE_KEY = 'pocketbridge_txs';

export const INCOME_CATEGORIES = ['Client Payment', 'Salary', 'Other Income'] as const;

export const EXPENSE_CATEGORIES = [
  'Materials',
  'Labour',
  'Equipment',
  'Transport',
  'Utilities',
  'Food',
  'Shopping',
  'Health',
  'Other',
] as const;

export const CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const;

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

export const SEED_TRANSACTIONS = [
  {
    date: '2026-05-28',
    desc: 'Client payment - Site A',
    cat: 'Client Payment',
    type: 'income' as const,
    amount: 35000,
    source: 'bank' as const,
  },
  {
    date: '2026-05-29',
    desc: 'Electricity bill',
    cat: 'Materials',
    type: 'expense' as const,
    amount: 1200,
    source: 'bank' as const,
  },
  {
    date: '2026-05-30',
    desc: 'Site labour wages',
    cat: 'Labour',
    type: 'expense' as const,
    amount: 450,
    source: 'cash' as const,
  },
  {
    date: '2026-05-31',
    desc: 'Auto rickshaw',
    cat: 'Transport',
    type: 'expense' as const,
    amount: 80,
    source: 'cash' as const,
  },
  {
    date: '2026-06-01',
    desc: 'Online grocery',
    cat: 'Materials',
    type: 'expense' as const,
    amount: 1800,
    source: 'bank' as const,
  },
];
