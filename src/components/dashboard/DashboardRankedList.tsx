import { formatCurrency } from '@/lib/currency';
import type { DashboardBreakdownRow } from '@/lib/dashboardAggregates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardRankedListProps = {
  title: string;
  rows: DashboardBreakdownRow[];
  emptyMessage?: string;
  showCount?: boolean;
};

/**
 * Ranked table of labels with amounts for dashboard summaries.
 */
export function DashboardRankedList({
  title,
  rows,
  emptyMessage = 'No data for the selected period.',
  showCount = true,
}: DashboardRankedListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-2 py-2 font-medium">#</th>
                  <th className="px-2 py-2 font-medium">Name</th>
                  {showCount && <th className="px-2 py-2 font-medium text-right">Count</th>}
                  <th className="px-2 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.label} className="border-b border-border/60">
                    <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                    <td className="px-2 py-2 font-medium">{row.label}</td>
                    {showCount && (
                      <td className="px-2 py-2 text-right text-muted-foreground">{row.count}</td>
                    )}
                    <td className="px-2 py-2 text-right font-medium">{formatCurrency(row.amount)}</td>
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
