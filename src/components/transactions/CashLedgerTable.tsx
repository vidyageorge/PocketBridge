import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { CashLedgerRow } from '@/lib/cashLedger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type CashLedgerTableProps = {
  rows: CashLedgerRow[];
  onDelete?: (id: number) => void;
  title?: string;
};

export function CashLedgerTable({
  rows,
  onDelete,
  title = 'Petty cash ledger',
}: CashLedgerTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No cash entries for the selected period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                  <th className="px-2 py-3 font-medium">Date</th>
                  <th className="px-2 py-3 font-medium">Client</th>
                  <th className="px-2 py-3 font-medium">Description</th>
                  <th className="px-2 py-3 font-medium">Category</th>
                  <th className="px-2 py-3 font-medium">Spent by</th>
                  <th className="px-2 py-3 font-medium text-right">Cash in</th>
                  <th className="px-2 py-3 font-medium text-right">Cash out</th>
                  <th className="px-2 py-3 font-medium text-right">Balance</th>
                  {onDelete && <th className="px-2 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="px-2 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {row.type === 'income' ? row.clientName ?? '—' : '—'}
                    </td>
                    <td className="px-2 py-3 max-w-[14rem]">
                      <span className="block truncate" title={row.desc}>
                        {row.desc}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">{row.cat}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {row.type === 'expense' ? row.spentBy ?? '—' : '—'}
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap text-income">
                      {row.moneyIn > 0 ? formatCurrency(row.moneyIn) : '—'}
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap text-expense">
                      {row.moneyOut > 0 ? formatCurrency(row.moneyOut) : '—'}
                    </td>
                    <td
                      className={`px-2 py-3 text-right whitespace-nowrap font-medium ${
                        row.runningBalance >= 0 ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {formatCurrency(row.runningBalance)}
                    </td>
                    {onDelete && (
                      <td className="px-2 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(row.id)}
                          aria-label={`Delete ${row.desc}`}
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
