import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MetricCardsProps = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
};

export function MetricCards({
  totalIncome,
  totalExpenses,
  netBalance,
  transactionCount,
}: MetricCardsProps) {
  const metrics = [
    { label: 'Total Income', value: formatCurrency(totalIncome), tone: 'text-income' },
    { label: 'Total Expenses', value: formatCurrency(totalExpenses), tone: 'text-expense' },
    {
      label: 'Net Balance',
      value: formatCurrency(netBalance),
      tone: netBalance >= 0 ? 'text-income' : 'text-expense',
    },
    { label: 'Transactions', value: String(transactionCount), tone: 'text-foreground' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${metric.tone}`}>{metric.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
