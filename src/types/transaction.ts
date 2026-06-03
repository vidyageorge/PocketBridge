export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'bank' | 'cash';

export type Transaction = {
  id: number;
  date: string;
  valueDate?: string;
  desc: string;
  location?: string;
  chqNo?: string;
  mode?: string;
  withdrawal?: number;
  deposit?: number;
  balance?: number;
  cat: string;
  type: TransactionType;
  amount: number;
  source: TransactionSource;
};

export type MonthFilter = number | 'all';
export type YearFilter = number | 'all';

export type ImportRow = {
  date: string;
  valueDate?: string;
  description: string;
  location?: string;
  chqNo?: string;
  mode?: string;
  withdrawal?: number;
  deposit?: number;
  balance?: number;
  category: string;
  type: TransactionType;
  amount: number;
  source: TransactionSource;
};

export type BankStatementEntry = {
  date: string;
  valueDate?: string;
  description: string;
  location?: string;
  chqNo?: string;
  mode?: string;
  withdrawal?: number;
  deposit?: number;
  balance?: number;
  amount: number;
  type: TransactionType;
};

export type BankStatementPreview = {
  entries: BankStatementEntry[];
  skipped: { row: number; reason: string }[];
  detectedColumns: {
    tranDate: string;
    valueDate: string;
    description: string;
    location: string;
    chqNo: string;
    debit: string;
    credit: string;
    balance: string;
  };
};
