import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  loadAccountBalanceSnapshots,
  saveAccountBalanceSnapshots,
  upsertAccountBalanceSnapshot,
} from '@/lib/accountBalanceStorage';
import { buildCashTransactionsFromClientPayments } from '@/lib/clientPaymentCashImport';
import { inferStatementPeriod } from '@/lib/filters';
import type { ClientPaymentRecord } from '@/types/clientPayment';
import { getNextTransactionId, loadTransactions, saveTransactions } from '@/lib/storage';
import type {
  AccountBalanceSnapshot,
  StatementBalanceSummary,
} from '@/types/accountBalance';
import type { ImportRow, Transaction, TransactionSource } from '@/types/transaction';

type TransactionContextValue = {
  transactions: Transaction[];
  balanceSnapshots: AccountBalanceSnapshot[];
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'source'>,
    source: TransactionSource,
  ) => void;
  deleteTransaction: (id: number) => void;
  updateTransaction: (transaction: Transaction) => void;
  clearTransactionsBySource: (source: TransactionSource) => void;
  importCashFromClientPayments: (records: ClientPaymentRecord[]) => number;
  importTransactions: (
    rows: ImportRow[],
    options?: { statementSummary?: StatementBalanceSummary; fileName?: string },
  ) => void;
};

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [balanceSnapshots, setBalanceSnapshots] = useState<AccountBalanceSnapshot[]>(() =>
    loadAccountBalanceSnapshots(),
  );

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

  const updateTransaction = useCallback((transaction: Transaction) => {
    setTransactions((current) => {
      const nextTransactions = current.map((existing) => {
        if (existing.id !== transaction.id) {
          return existing;
        }

        const hasStatementColumns =
          existing.withdrawal !== undefined ||
          existing.deposit !== undefined ||
          existing.balance !== undefined;

        if (!hasStatementColumns) {
          return { ...transaction, source: existing.source };
        }

        if (transaction.type === 'expense') {
          return {
            ...transaction,
            source: existing.source,
            withdrawal: transaction.amount,
            deposit: undefined,
          };
        }

        return {
          ...transaction,
          source: existing.source,
          deposit: transaction.amount,
          withdrawal: undefined,
        };
      });
      saveTransactions(nextTransactions);
      return nextTransactions;
    });
  }, []);

  const importCashFromClientPayments = useCallback(
    (clientPaymentRecords: ClientPaymentRecord[]) => {
      let importedCount = 0;

      setTransactions((current) => {
        const imported = buildCashTransactionsFromClientPayments(
          clientPaymentRecords,
          current,
        );
        importedCount = imported.length;

        if (imported.length === 0) {
          return current;
        }

        const nextTransactions = [...imported, ...current];
        saveTransactions(nextTransactions);
        return nextTransactions;
      });

      return importedCount;
    },
    [],
  );

  const clearTransactionsBySource = useCallback((source: TransactionSource) => {
    setTransactions((current) => {
      const nextTransactions = current.filter((transaction) => transaction.source !== source);
      saveTransactions(nextTransactions);
      return nextTransactions;
    });

    if (source === 'bank') {
      setBalanceSnapshots((current) => {
        const nextSnapshots = current.filter((snapshot) => snapshot.source !== 'bank');
        saveAccountBalanceSnapshots(nextSnapshots);
        return nextSnapshots;
      });
    }
  }, []);

  const importTransactions = useCallback(
    (
      rows: ImportRow[],
      options?: { statementSummary?: StatementBalanceSummary; fileName?: string },
    ) => {
      if (options?.statementSummary) {
        setBalanceSnapshots((current) => {
          const nextSnapshots = upsertAccountBalanceSnapshot(current, {
            source: 'bank',
            asOnDate: options.statementSummary!.asOnDate,
            balance: options.statementSummary!.balance,
            fileName: options.fileName ?? 'statement',
          });
          saveAccountBalanceSnapshots(nextSnapshots);
          return nextSnapshots;
        });
      }

      if (rows.length === 0) {
        return;
      }

      setTransactions((current) => {
        const importDates = rows.map((row) => row.date);
        if (options?.statementSummary?.asOnDate) {
          importDates.push(options.statementSummary.asOnDate);
        }

        const replacePeriod = inferStatementPeriod(options?.fileName ?? '', importDates);
        const bankSource = rows[0]?.source ?? 'bank';

        const keptTransactions =
          replacePeriod === null
            ? current
            : current.filter((transaction) => {
                if (transaction.source !== bankSource) {
                  return true;
                }

                const [yearPart, monthPart] = transaction.date.split('-').map(Number);
                return !(
                  yearPart === replacePeriod.year && monthPart === replacePeriod.month
                );
              });

        let nextId = getNextTransactionId(keptTransactions);
        const imported = rows.map((row) => ({
          id: nextId++,
          date: row.date,
          valueDate: row.valueDate,
          desc: row.description,
          location: row.location,
          chqNo: row.chqNo,
          mode: row.mode,
          withdrawal: row.withdrawal,
          deposit: row.deposit,
          balance: row.balance,
          cat: row.category,
          type: row.type,
          amount: row.amount,
          source: row.source,
        }));
        const nextTransactions = [...imported, ...keptTransactions];
        saveTransactions(nextTransactions);
        return nextTransactions;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      transactions,
      balanceSnapshots,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      clearTransactionsBySource,
      importCashFromClientPayments,
      importTransactions,
    }),
    [
      transactions,
      balanceSnapshots,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      clearTransactionsBySource,
      importCashFromClientPayments,
      importTransactions,
    ],
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
