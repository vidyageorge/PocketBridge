export type ProjectExpenseRecord = {
  id: number;
  sheetMonth: number;
  sheetYear: number;
  sheetName: string;
  sno: string;
  description: string;
  projectCode: string;
  amount: number;
  income: number;
  cumulativeTotal: number;
};

export type EmployeeExpenseRecord = {
  id: number;
  sheetMonth: number;
  sheetYear: number;
  sheetName: string;
  sno: string;
  description: string;
  employeeName: string;
  amount: number;
  cumulativeTotal: number;
};

export type ExpenseData = {
  project: ProjectExpenseRecord[];
  employee: EmployeeExpenseRecord[];
};

export type ExpenseSummary = {
  lineCount: number;
  totalAmount: number;
};
