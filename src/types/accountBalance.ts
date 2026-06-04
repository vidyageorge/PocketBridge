export type StatementBalanceSummary = {
  asOnDate: string;
  balance: number;
};

export type AccountBalanceSnapshot = {
  source: 'bank';
  asOnDate: string;
  balance: number;
  fileName: string;
};

export type AccountBalanceInfo = {
  balance: number;
  asOnDate: string;
  origin: 'statement' | 'running';
};
