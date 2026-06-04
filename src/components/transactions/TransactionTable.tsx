import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/types/transaction';

type TransactionTableProps = {
  transactions: Transaction[];
  onDelete?: (id: number) => void;
  showSource?: boolean;
  variant?: 'simple' | 'statement';
  showClientColumn?: boolean;
  title?: string;
};

function formatStatementAmount(value: number | undefined): string {
  if (value === undefined || value <= 0) {
    return '—';
  }
  return formatCurrency(value);
}

export function TransactionTable({
  transactions,
  onDelete,
  showSource = true,
  variant = 'simple',
  showClientColumn = false,
  title = 'Transactions',
}: TransactionTableProps) {
  const isStatement = variant === 'statement';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions for the selected period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className={`w-full text-left text-sm ${
                isStatement ? 'min-w-[900px] table-fixed' : 'min-w-[640px]'
              }`}
            >
              {isStatement && (
                <colgroup>
                  <col className="w-[5.5rem]" />
                  <col className="w-[5.5rem]" />
                  <col />
                  <col className="w-[6.5rem]" />
                  <col className="w-[6.5rem]" />
                  <col className="w-[7.5rem]" />
                  {showSource && <col className="w-[4.5rem]" />}
                </colgroup>
              )}
              <thead>
                <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                  {isStatement ? (
                    <>
                      <th className="px-2 py-3 font-medium whitespace-nowrap">Tran Date</th>
                      <th className="px-2 py-3 font-medium whitespace-nowrap">Value Date</th>
                      <th className="px-2 py-3 font-medium">Particulars</th>
                      <th className="px-2 py-3 font-medium text-right whitespace-nowrap">
                        Withdrawals
                      </th>
                      <th className="px-2 py-3 font-medium text-right whitespace-nowrap">
                        Deposits
                      </th>
                      <th className="px-2 py-3 font-medium text-right whitespace-nowrap">
                        Balance (INR)
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-2 py-3 font-medium">Date</th>
                      <th className="px-2 py-3 font-medium">Description</th>
                      <th className="px-2 py-3 font-medium">Category</th>
                    </>
                  )}
                  {showSource && <th className="px-2 py-3 font-medium">Source</th>}
                  {!isStatement && <th className="px-2 py-3 font-medium">Type</th>}
                  {!isStatement && <th className="px-2 py-3 font-medium text-right">Amount</th>}
                  {onDelete && <th className="px-2 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const withdrawal =
                    transaction.withdrawal ??
                    (transaction.type === 'expense' ? transaction.amount : undefined);
                  const deposit =
                    transaction.deposit ??
                    (transaction.type === 'income' ? transaction.amount : undefined);

                  return (
                    <tr key={transaction.id} className="border-b border-border/60">
                      {isStatement ? (
                        <>
                          <td className="px-2 py-3 whitespace-nowrap">{transaction.date}</td>
                          <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                            {transaction.valueDate ?? transaction.date}
                          </td>
                          <td className="px-2 py-3 max-w-0 overflow-hidden">
                            <span className="block truncate" title={transaction.desc}>
                              {transaction.desc}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-right whitespace-nowrap text-expense">
                            {formatStatementAmount(withdrawal)}
                          </td>
                          <td className="px-2 py-3 text-right whitespace-nowrap text-income">
                            {formatStatementAmount(deposit)}
                          </td>
                          <td className="px-2 py-3 text-right whitespace-nowrap font-medium">
                            {transaction.balance !== undefined
                              ? formatCurrency(transaction.balance)
                              : '—'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-3 whitespace-nowrap">{transaction.date}</td>
                          <td className="px-2 py-3 max-w-[16rem] overflow-hidden">
                            <span className="block truncate" title={transaction.desc}>
                              {transaction.desc}
                            </span>
                          </td>
                          {showClientColumn && (
                            <td className="px-2 py-3 whitespace-nowrap">
                              {transaction.clientName ?? '—'}
                            </td>
                          )}
                          <td className="px-2 py-3">{transaction.cat}</td>
                        </>
                      )}
                      {showSource && (
                        <td className="px-2 py-3">
                          <Badge variant={transaction.source}>
                            {transaction.source === 'bank' ? 'Bank' : 'Cash'}
                          </Badge>
                        </td>
                      )}
                      {!isStatement && (
                        <>
                          <td className="px-2 py-3">
                            <Badge variant={transaction.type}>
                              {transaction.type === 'income' ? 'Income' : 'Expense'}
                            </Badge>
                          </td>
                          <td
                            className={`px-2 py-3 text-right font-medium ${
                              transaction.type === 'income' ? 'text-income' : 'text-expense'
                            }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </td>
                        </>
                      )}
                      {onDelete && (
                        <td className="px-2 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(transaction.id)}
                            aria-label={`Delete ${transaction.desc}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
