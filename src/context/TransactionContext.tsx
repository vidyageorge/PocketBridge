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
import { syncCashTransactionsFromClientPayments } from '@/lib/clientPaymentCashImport';
import { inferStatementPeriod } from '@/lib/filters';
import type { ClientPaymentRecord } from '@/types/clientPayment';
import { buildFieldChanges, captureStoreSnapshot } from '@/lib/activityLog';
import { recordActivity } from '@/lib/activityLogRecorder';
import { STORE_KEYS } from '@/lib/storeKeys';
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
  syncCashFromClientPayments: (records: ClientPaymentRecord[]) => void;
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
      const undoPayload = captureStoreSnapshot([STORE_KEYS.TRANSACTIONS]);

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

      recordActivity({
        action: 'create',
        entityType: 'transaction',
        title: `Added ${source} entry: ${transaction.desc}`,
        detail: transaction.date,
        undoPayload,
      });
    },
    [],
  );

  const deleteTransaction = useCallback((id: number) => {
    const deleted = transactions.find((transaction) => transaction.id === id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.TRANSACTIONS]);

    setTransactions((current) => {
      const nextTransactions = current.filter((transaction) => transaction.id !== id);
      saveTransactions(nextTransactions);
      return nextTransactions;
    });

    if (deleted) {
      recordActivity({
        action: 'delete',
        entityType: 'transaction',
        title: `Deleted ${deleted.source} entry: ${deleted.desc}`,
        detail: deleted.date,
        undoPayload,
      });
    }
  }, [transactions]);

  const updateTransaction = useCallback((transaction: Transaction) => {
    const before = transactions.find((existing) => existing.id === transaction.id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.TRANSACTIONS]);

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

    if (before) {
      recordActivity({
        action: 'update',
        entityType: 'transaction',
        title: `Updated ${before.source} entry: ${transaction.desc}`,
        detail: transaction.date,
        changes: buildFieldChanges(
          before as unknown as Record<string, unknown>,
          transaction as unknown as Record<string, unknown>,
          [
            { key: 'date', label: 'Date' },
            { key: 'desc', label: 'Description' },
            { key: 'amount', label: 'Amount' },
            { key: 'cat', label: 'Category' },
            { key: 'type', label: 'Type' },
          ],
        ),
        undoPayload,
      });
    }
  }, [transactions]);

  const syncCashFromClientPayments = useCallback((clientPaymentRecords: ClientPaymentRecord[]) => {
    setTransactions((current) => {
      const nextTransactions = syncCashTransactionsFromClientPayments(
        clientPaymentRecords,
        current,
      );
      saveTransactions(nextTransactions);
      return nextTransactions;
    });
  }, []);

  const clearTransactionsBySource = useCallback((source: TransactionSource) => {
    const removedCount = transactions.filter((transaction) => transaction.source === source).length;
    const storeKeys =
      source === 'bank'
        ? [STORE_KEYS.TRANSACTIONS, STORE_KEYS.ACCOUNT_BALANCES]
        : [STORE_KEYS.TRANSACTIONS];
    const undoPayload = captureStoreSnapshot(storeKeys);

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

    recordActivity({
      action: 'clear',
      entityType: 'transaction',
      title: `Cleared all ${source} entries (${removedCount})`,
      undoPayload,
    });
  }, [transactions]);

  const importTransactions = useCallback(
    (
      rows: ImportRow[],
      options?: { statementSummary?: StatementBalanceSummary; fileName?: string },
    ) => {
      const undoPayload = captureStoreSnapshot([
        STORE_KEYS.TRANSACTIONS,
        STORE_KEYS.ACCOUNT_BALANCES,
      ]);

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
        if (options?.statementSummary) {
          recordActivity({
            action: 'import',
            entityType: 'transaction',
            title: `Imported bank balance snapshot`,
            detail: options.fileName ?? 'statement',
            undoPayload,
          });
        }
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

      recordActivity({
        action: 'import',
        entityType: 'transaction',
        title: `Imported bank statement (${rows.length} entries)`,
        detail: options?.fileName ?? 'statement',
        undoPayload,
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
      syncCashFromClientPayments,
      importTransactions,
    }),
    [
      transactions,
      balanceSnapshots,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      clearTransactionsBySource,
      syncCashFromClientPayments,
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
