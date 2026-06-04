import { Pencil, Trash2 } from 'lucide-react';
import { confirmDeleteEntry } from '@/lib/confirmDelete';
import { formatCurrency } from '@/lib/currency';
import type { CashLedgerRow } from '@/lib/cashLedger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type CashLedgerTableProps = {
  rows: CashLedgerRow[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  title?: string;
};

function handleDeleteRow(row: CashLedgerRow, onDelete: (id: number) => void): void {
  const amountLabel = row.type === 'income' ? 'Cash in' : 'Cash out';
  const amountValue = row.type === 'income' ? row.moneyIn : row.moneyOut;
  const summary = `${row.date} — ${row.desc}\n${amountLabel}: ${amountValue}`;

  if (confirmDeleteEntry(summary)) {
    onDelete(row.id);
  }
}

export function CashLedgerTable({
  rows,
  onEdit,
  onDelete,
  title = 'Petty cash ledger',
}: CashLedgerTableProps) {
  const showActions = Boolean(onEdit || onDelete);

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
            <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
              <colgroup>
                <col className="w-[6.5rem]" />
                <col className="w-[11rem]" />
                <col />
                <col className="w-[8.5rem]" />
                <col className="w-[9rem]" />
                <col className="w-[8.5rem]" />
                <col className="w-[8.5rem]" />
                <col className="w-[9.5rem]" />
                {showActions && <col className="w-[5.5rem]" />}
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                  <th className="px-2 py-3 font-medium">Date</th>
                  <th className="px-2 py-3 font-medium">Client</th>
                  <th className="px-2 py-3 font-medium">Description</th>
                  <th className="px-2 py-3 font-medium">Category</th>
                  <th className="px-2 py-3 font-medium">Spent by</th>
                  <th className="px-2 py-3 text-right font-medium">Cash in</th>
                  <th className="px-2 py-3 text-right font-medium">Cash out</th>
                  <th className="px-2 py-3 text-right font-medium">Balance</th>
                  {showActions && (
                    <th className="px-2 py-3 text-center font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="px-2 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {row.type === 'income' ? row.clientName ?? '—' : '—'}
                    </td>
                    <td className="px-2 py-3">
                      <span className="block max-w-[18rem] truncate" title={row.desc}>
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
                    {showActions && (
                      <td className="px-2 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          {onEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 shrink-0 px-0"
                              onClick={() => onEdit(row.id)}
                              aria-label={`Edit ${row.desc}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 shrink-0 px-0"
                              onClick={() => handleDeleteRow(row, onDelete)}
                              aria-label={`Delete ${row.desc}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
