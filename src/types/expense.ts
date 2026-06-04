export type ProjectExpenseRecord = {
  id: number;
  sheetMonth: number;
  sheetYear: number;
  sheetName: string;
  sno: string;
  description: string;
  projectCode: string;
  paymentDate: string;
  amount: number;
  income: number;
  cumulativeTotal: number;
};

export type ProjectExpenseInput = Omit<ProjectExpenseRecord, 'id'>;

export type EmployeeExpenseRecord = {
  id: number;
  sheetMonth: number;
  sheetYear: number;
  sheetName: string;
  sno: string;
  description: string;
  employeeName: string;
  paymentDate: string;
  amount: number;
  cumulativeTotal: number;
};

export type EmployeeExpenseInput = Omit<EmployeeExpenseRecord, 'id'>;

export type ExpenseData = {
  project: ProjectExpenseRecord[];
  employee: EmployeeExpenseRecord[];
};

export type ExpenseSummary = {
  lineCount: number;
  totalAmount: number;
};

export type EmployeeMonthlySummary = {
  employeeName: string;
  salary: number;
  advance: number;
  totalSpent: number;
};

export type ProjectMonthlySummary = {
  projectCode: string;
  totalSpent: number;
  totalIncome: number;
};
