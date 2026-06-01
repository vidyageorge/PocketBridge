export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'bank' | 'cash';

export type Transaction = {
  id: number;
  date: string;
  desc: string;
  cat: string;
  type: TransactionType;
  amount: number;
  source: TransactionSource;
};

export type MonthFilter = number | 'all';
export type YearFilter = number | 'all';

export type ImportRow = {
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  source: TransactionSource;
};

export type BankStatementEntry = {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
};

export type BankStatementPreview = {
  entries: BankStatementEntry[];
  skipped: { row: number; reason: string }[];
  detectedColumns: {
    date: string;
    description: string;
    debit: string;
    credit: string;
  };
};
