import { Trash2 } from 'lucide-react';
import { formatCurrencySigned } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/types/transaction';

type TransactionTableProps = {
  transactions: Transaction[];
  onDelete?: (id: number) => void;
  showSource?: boolean;
  title?: string;
};

export function TransactionTable({
  transactions,
  onDelete,
  showSource = true,
  title = 'Transactions',
}: TransactionTableProps) {
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
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-2 py-3 font-medium">Date</th>
                  <th className="px-2 py-3 font-medium">Description</th>
                  <th className="px-2 py-3 font-medium">Category</th>
                  {showSource && <th className="px-2 py-3 font-medium">Source</th>}
                  <th className="px-2 py-3 font-medium">Type</th>
                  <th className="px-2 py-3 font-medium text-right">Amount</th>
                  {onDelete && <th className="px-2 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border/60">
                    <td className="px-2 py-3 whitespace-nowrap">{transaction.date}</td>
                    <td className="px-2 py-3">{transaction.desc}</td>
                    <td className="px-2 py-3">{transaction.cat}</td>
                    {showSource && (
                      <td className="px-2 py-3">
                        <Badge variant={transaction.source}>
                          {transaction.source === 'bank' ? 'Bank' : 'Cash'}
                        </Badge>
                      </td>
                    )}
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
                      {formatCurrencySigned(transaction.amount, transaction.type)}
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
