import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExpenseSummary } from '@/types/expense';

type ExpenseMetricCardsProps = {
  summary: ExpenseSummary;
};

export function ExpenseMetricCards({ summary }: ExpenseMetricCardsProps) {
  const metrics = [
    { label: 'Expense lines', value: String(summary.lineCount), tone: 'text-foreground' },
    { label: 'Total amount', value: formatCurrency(summary.totalAmount), tone: 'text-expense' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${metric.tone}`}>{metric.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
