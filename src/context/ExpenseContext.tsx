import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { buildFieldChanges, captureStoreSnapshot } from '@/lib/activityLog';
import { recordActivity } from '@/lib/activityLogRecorder';
import {
  formatExpenseSheetName,
  getNextEmployeeExpenseId,
  getNextProjectExpenseId,
  parseExpenseWorkbook,
} from '@/lib/expense';
import { loadExpenseData, saveExpenseData } from '@/lib/expenseStorage';
import { STORE_KEYS } from '@/lib/storeKeys';
import type {
  EmployeeExpenseInput,
  EmployeeExpenseRecord,
  ExpenseData,
  ProjectExpenseInput,
  ProjectExpenseRecord,
} from '@/types/expense';

type ExpenseContextValue = {
  data: ExpenseData;
  replaceFromFile: (file: File) => Promise<number>;
  importParsedData: (data: ExpenseData, fileName: string) => number;
  addEmployeeExpense: (record: EmployeeExpenseInput) => void;
  updateEmployeeExpense: (record: EmployeeExpenseRecord) => void;
  deleteEmployeeExpense: (id: number) => void;
  addProjectExpense: (record: ProjectExpenseInput) => void;
  updateProjectExpense: (record: ProjectExpenseRecord) => void;
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
    const undoPayload = captureStoreSnapshot([STORE_KEYS.EXPENSES]);
    const buffer = await file.arrayBuffer();
    const parsed = parseExpenseWorkbook(buffer);
    setData(parsed);
    saveExpenseData(parsed);

    recordActivity({
      action: 'import',
      entityType: 'expense_project',
      title: `Imported expense workbook (${parsed.project.length + parsed.employee.length} entries)`,
      detail: file.name,
      undoPayload,
    });

    return parsed.project.length + parsed.employee.length;
  }, []);

  const importParsedData = useCallback((parsed: ExpenseData, _fileName: string) => {
    setData(parsed);
    saveExpenseData(parsed);
    return parsed.project.length + parsed.employee.length;
  }, []);

  const addEmployeeExpense = useCallback((record: EmployeeExpenseInput) => {
    const undoPayload = captureStoreSnapshot([STORE_KEYS.EXPENSES]);

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

    recordActivity({
      action: 'create',
      entityType: 'expense_employee',
      title: `Added employee expense: ${record.description}`,
      detail: record.employeeName,
      undoPayload,
    });
  }, []);

  const updateEmployeeExpense = useCallback((record: EmployeeExpenseRecord) => {
    const before = data.employee.find((existing) => existing.id === record.id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.EXPENSES]);

    setData((current) =>
      persistExpenseData({
        ...current,
        employee: current.employee.map((existing) =>
          existing.id === record.id ? record : existing,
        ),
      }),
    );

    if (before) {
      recordActivity({
        action: 'update',
        entityType: 'expense_employee',
        title: `Updated employee expense: ${record.description}`,
        detail: record.employeeName,
        changes: buildFieldChanges(
          before as unknown as Record<string, unknown>,
          record as unknown as Record<string, unknown>,
          [
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount' },
            { key: 'paymentDate', label: 'Payment date' },
          ],
        ),
        undoPayload,
      });
    }
  }, [data.employee]);

  const deleteEmployeeExpense = useCallback((id: number) => {
    const deleted = data.employee.find((record) => record.id === id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.EXPENSES]);

    setData((current) =>
      persistExpenseData({
        ...current,
        employee: current.employee.filter((record) => record.id !== id),
      }),
    );

    if (deleted) {
      recordActivity({
        action: 'delete',
        entityType: 'expense_employee',
        title: `Deleted employee expense: ${deleted.description}`,
        detail: deleted.employeeName,
        undoPayload,
      });
    }
  }, [data.employee]);

  const addProjectExpense = useCallback((record: ProjectExpenseInput) => {
    const undoPayload = captureStoreSnapshot([STORE_KEYS.EXPENSES]);

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

    recordActivity({
      action: 'create',
      entityType: 'expense_project',
      title: `Added project expense: ${record.description}`,
      detail: record.projectCode,
      undoPayload,
    });
  }, []);

  const updateProjectExpense = useCallback((record: ProjectExpenseRecord) => {
    const before = data.project.find((existing) => existing.id === record.id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.EXPENSES]);

    setData((current) =>
      persistExpenseData({
        ...current,
        project: current.project.map((existing) =>
          existing.id === record.id ? record : existing,
        ),
      }),
    );

    if (before) {
      recordActivity({
        action: 'update',
        entityType: 'expense_project',
        title: `Updated project expense: ${record.description}`,
        detail: record.projectCode,
        changes: buildFieldChanges(
          before as unknown as Record<string, unknown>,
          record as unknown as Record<string, unknown>,
          [
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount' },
            { key: 'paymentDate', label: 'Payment date' },
          ],
        ),
        undoPayload,
      });
    }
  }, [data.project]);

  const deleteProjectExpense = useCallback((id: number) => {
    const deleted = data.project.find((record) => record.id === id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.EXPENSES]);

    setData((current) =>
      persistExpenseData({
        ...current,
        project: current.project.filter((record) => record.id !== id),
      }),
    );

    if (deleted) {
      recordActivity({
        action: 'delete',
        entityType: 'expense_project',
        title: `Deleted project expense: ${deleted.description}`,
        detail: deleted.projectCode,
        undoPayload,
      });
    }
  }, [data.project]);

  const value = useMemo(
    () => ({
      data,
      replaceFromFile,
      importParsedData,
      addEmployeeExpense,
      updateEmployeeExpense,
      deleteEmployeeExpense,
      addProjectExpense,
      updateProjectExpense,
      deleteProjectExpense,
    }),
    [
      data,
      replaceFromFile,
      importParsedData,
      addEmployeeExpense,
      updateEmployeeExpense,
      deleteEmployeeExpense,
      addProjectExpense,
      updateProjectExpense,
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
