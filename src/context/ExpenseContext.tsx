import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  formatExpenseSheetName,
  getNextEmployeeExpenseId,
  getNextProjectExpenseId,
  parseExpenseWorkbook,
} from '@/lib/expense';
import { loadExpenseData, saveExpenseData } from '@/lib/expenseStorage';
import type { EmployeeExpenseInput, ExpenseData, ProjectExpenseInput } from '@/types/expense';

type ExpenseContextValue = {
  data: ExpenseData;
  replaceFromFile: (file: File) => Promise<number>;
  addEmployeeExpense: (record: EmployeeExpenseInput) => void;
  deleteEmployeeExpense: (id: number) => void;
  addProjectExpense: (record: ProjectExpenseInput) => void;
  deleteProjectExpense: (id: number) => void;
};

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

function persistExpenseData(data: ExpenseData): ExpenseData {
  saveExpenseData(data);
  return data;
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ExpenseData>(() => loadExpenseData());

  const replaceFromFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseExpenseWorkbook(buffer);
    setData(parsed);
    saveExpenseData(parsed);
    return parsed.project.length + parsed.employee.length;
  }, []);

  const addEmployeeExpense = useCallback((record: EmployeeExpenseInput) => {
    setData((current) => {
      const nextRecord = {
        ...record,
        id: getNextEmployeeExpenseId(current.employee),
        sheetName: record.sheetName || formatExpenseSheetName(record.sheetMonth, record.sheetYear),
      };
      return persistExpenseData({
        ...current,
        employee: [...current.employee, nextRecord],
      });
    });
  }, []);

  const deleteEmployeeExpense = useCallback((id: number) => {
    setData((current) =>
      persistExpenseData({
        ...current,
        employee: current.employee.filter((record) => record.id !== id),
      }),
    );
  }, []);

  const addProjectExpense = useCallback((record: ProjectExpenseInput) => {
    setData((current) => {
      const nextRecord = {
        ...record,
        id: getNextProjectExpenseId(current.project),
        sheetName: record.sheetName || formatExpenseSheetName(record.sheetMonth, record.sheetYear),
      };
      return persistExpenseData({
        ...current,
        project: [...current.project, nextRecord],
      });
    });
  }, []);

  const deleteProjectExpense = useCallback((id: number) => {
    setData((current) =>
      persistExpenseData({
        ...current,
        project: current.project.filter((record) => record.id !== id),
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      data,
      replaceFromFile,
      addEmployeeExpense,
      deleteEmployeeExpense,
      addProjectExpense,
      deleteProjectExpense,
    }),
    [
      data,
      replaceFromFile,
      addEmployeeExpense,
      deleteEmployeeExpense,
      addProjectExpense,
      deleteProjectExpense,
    ],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within ExpenseProvider');
  }
  return context;
}
