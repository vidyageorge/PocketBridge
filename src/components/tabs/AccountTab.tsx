import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { exportTransactionsToExcel } from '@/lib/excel';
import { filterTransactions } from '@/lib/filters';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { useTransactions } from '@/context/TransactionContext';
import { Button } from '@/components/ui/button';
import { MonthYearFilter } from '@/components/filters/MonthYearFilter';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { BankStatementImport } from '@/components/transactions/BankStatementImport';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import type { TransactionSource } from '@/types/transaction';

type AccountTabProps = {
  source: TransactionSource;
};

export function AccountTab({ source }: AccountTabProps) {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { month, year, setMonth, setYear } = usePeriodFilter();

  const accountTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.source === source),
    [transactions, source],
  );

  const filtered = useMemo(
    () => filterTransactions(accountTransactions, month, year),
    [accountTransactions, month, year],
  );

  const label = source === 'bank' ? 'Bank Account' : 'Cash Account';

  return (
    <div className="space-y-6">
      {source === 'bank' && <BankStatementImport />}

      {source === 'cash' && (
        <TransactionForm
          source={source}
          onSubmit={(transaction) => addTransaction(transaction, source)}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <MonthYearFilter
          month={month}
          year={year}
          transactions={transactions}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
        <Button
          variant="outline"
          onClick={() => exportTransactionsToExcel(transactions, source, month, year)}
        >
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <TransactionTable
        transactions={filtered}
        onDelete={deleteTransaction}
        showSource={false}
        variant={source === 'bank' ? 'statement' : 'simple'}
        title={source === 'bank' ? 'Bank Statement' : `${label} Transactions`}
      />
    </div>
  );
}
