import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getNextTransactionId, loadTransactions, saveTransactions } from '@/lib/storage';
import type { ImportRow, Transaction, TransactionSource } from '@/types/transaction';

type TransactionContextValue = {
  transactions: Transaction[];
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'source'>,
    source: TransactionSource,
  ) => void;
  deleteTransaction: (id: number) => void;
  importTransactions: (rows: ImportRow[]) => void;
};

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());

  const addTransaction = useCallback(
    (transaction: Omit<Transaction, 'id' | 'source'>, source: TransactionSource) => {
      setTransactions((current) => {
        const nextTransaction: Transaction = {
          ...transaction,
          id: getNextTransactionId(current),
          source,
        };
        const nextTransactions = [nextTransaction, ...current];
        saveTransactions(nextTransactions);
        return nextTransactions;
      });
    },
    [],
  );

  const deleteTransaction = useCallback((id: number) => {
    setTransactions((current) => {
      const nextTransactions = current.filter((transaction) => transaction.id !== id);
      saveTransactions(nextTransactions);
      return nextTransactions;
    });
  }, []);

  const importTransactions = useCallback((rows: ImportRow[]) => {
    setTransactions((current) => {
      let nextId = getNextTransactionId(current);
      const imported = rows.map((row) => ({
        id: nextId++,
        date: row.date,
        desc: row.description,
        cat: row.category,
        type: row.type,
        amount: row.amount,
        source: row.source,
      }));
      const nextTransactions = [...imported, ...current];
      saveTransactions(nextTransactions);
      return nextTransactions;
    });
  }, []);

  const value = useMemo(
    () => ({
      transactions,
      addTransaction,
      deleteTransaction,
      importTransactions,
    }),
    [transactions, addTransaction, deleteTransaction, importTransactions],
  );

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactions(): TransactionContextValue {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}
