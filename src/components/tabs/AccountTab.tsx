import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { exportTransactionsToExcel } from '@/lib/excel';
import { filterTransactions } from '@/lib/filters';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { useClientPayments } from '@/context/ClientPaymentContext';
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
import type { TransactionSource } from '@/types/transaction';

type AccountTabProps = {
  source: TransactionSource;
};

export function AccountTab({ source }: AccountTabProps) {
  const { records: clientPaymentRecords } = useClientPayments();
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    clearTransactionsBySource,
    importCashFromClientPayments,
  } = useTransactions();
  const { month, year, setMonth, setYear } = usePeriodFilter();

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

  return (
    <div className="space-y-6">
      {source === 'bank' && <BankStatementImport />}

      {source === 'cash' && (
        <>
          <TransactionForm
            source={source}
            onSubmit={(transaction) => addTransaction(transaction, source)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const count = importCashFromClientPayments(clientPaymentRecords);
                window.alert(
                  count > 0
                    ? `Loaded ${count} cash lines from client payment workbook.`
                    : 'No new cash lines to load (already imported or none in workbook).',
                );
              }}
            >
              Load cash from client payments
            </Button>
          </div>
        </>
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
          {accountTransactions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const confirmed = window.confirm(
                  `Delete all ${accountTransactions.length} ${label.toLowerCase()} entries? This cannot be undone.`,
                );
                if (confirmed) {
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
          onDelete={deleteTransaction}
          title={`Petty cash ledger (${cashLedgerRows.length} entries)`}
        />
      ) : (
        <TransactionTable
          transactions={filtered}
          onDelete={deleteTransaction}
          showSource={false}
          variant="statement"
          title={`Bank Statement (${filtered.length} entries)`}
        />
      )}
    </div>
  );
}
