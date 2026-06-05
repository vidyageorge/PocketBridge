import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { confirmDeleteAll } from '@/lib/confirmDelete';
import { exportTransactionsToExcel } from '@/lib/excel';
import { filterTransactions } from '@/lib/filters';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { useTransactions } from '@/context/TransactionContext';
import { Button } from '@/components/ui/button';
import { MonthYearFilter } from '@/components/filters/MonthYearFilter';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { BankStatementImport } from '@/components/transactions/BankStatementImport';
import { AccountBalanceCards } from '@/components/dashboard/AccountBalanceCards';
import { buildCashLedgerRows, summarizeCashLedger } from '@/lib/cashLedger';
import { CashLedgerSummaryCards } from '@/components/transactions/CashLedgerSummaryCards';
import { CashLedgerTable } from '@/components/transactions/CashLedgerTable';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import type { Transaction, TransactionSource } from '@/types/transaction';

type AccountTabProps = {
  source: TransactionSource;
};

export function AccountTab({ source }: AccountTabProps) {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearTransactionsBySource,
  } = useTransactions();
  const { month, year, setMonth, setYear } = usePeriodFilter();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const accountTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.source === source),
    [transactions, source],
  );

  const filtered = useMemo(
    () => filterTransactions(accountTransactions, month, year),
    [accountTransactions, month, year],
  );

  const cashLedgerRows = useMemo(
    () => (source === 'cash' ? buildCashLedgerRows(filtered) : []),
    [source, filtered],
  );

  const cashLedgerSummary = useMemo(
    () => summarizeCashLedger(cashLedgerRows),
    [cashLedgerRows],
  );

  const label = source === 'bank' ? 'Bank Account' : 'Cash Account';

  const handleEditTransaction = (id: number) => {
    const record = transactions.find((transaction) => transaction.id === id);
    if (record) {
      setEditingTransaction(record);
    }
  };

  const handleDeleteTransaction = (id: number) => {
    deleteTransaction(id);
    if (editingTransaction?.id === id) {
      setEditingTransaction(null);
    }
  };

  return (
    <div className="space-y-6">
      {source === 'bank' && <BankStatementImport />}

      {(source === 'cash' || editingTransaction) && (
        <TransactionForm
          source={source}
          editingTransaction={editingTransaction}
          onSubmit={(transaction) => addTransaction(transaction, source)}
          onUpdate={updateTransaction}
          onCancelEdit={() => setEditingTransaction(null)}
        />
      )}

      {source === 'bank' && (
        <AccountBalanceCards showBank showCash={false} showCombined={false} title="Bank balance" />
      )}

      {source === 'cash' && <CashLedgerSummaryCards summary={cashLedgerSummary} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <MonthYearFilter
          month={month}
          year={year}
          transactions={transactions}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
        <div className="flex flex-wrap gap-2">
          {source === 'cash' && accountTransactions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                if (
                  confirmDeleteAll(
                    accountTransactions.length,
                    `${label.toLowerCase()} entries`,
                  )
                ) {
                  clearTransactionsBySource(source);
                }
              }}
            >
              Delete all
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => exportTransactionsToExcel(transactions, source, month, year)}
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {filtered.length === 0 && accountTransactions.length > 0 && (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No {label.toLowerCase()} lines for this month and year.
        </p>
      )}

      {source === 'cash' ? (
        <CashLedgerTable
          rows={cashLedgerRows}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          title={`Petty cash ledger (${cashLedgerRows.length} entries)`}
        />
      ) : (
        <TransactionTable
          transactions={filtered}
          showSource={false}
          variant="statement"
          title={`Bank Statement (${filtered.length} entries)`}
        />
      )}
    </div>
  );
}
