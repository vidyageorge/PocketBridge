import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { parseExpenseWorkbook } from '@/lib/expense';
import { loadExpenseData, saveExpenseData } from '@/lib/expenseStorage';
import type { ExpenseData } from '@/types/expense';

type ExpenseContextValue = {
  data: ExpenseData;
  replaceFromFile: (file: File) => Promise<number>;
};

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ExpenseData>(() => loadExpenseData());

  const replaceFromFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseExpenseWorkbook(buffer);
    setData(parsed);
    saveExpenseData(parsed);
    return parsed.project.length + parsed.employee.length;
  }, []);

  const value = useMemo(
    () => ({
      data,
      replaceFromFile,
    }),
    [data, replaceFromFile],
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
