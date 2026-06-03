import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProcurementSummary } from '@/types/procurement';

type ProcurementMetricCardsProps = {
  summary: ProcurementSummary;
};

export function ProcurementMetricCards({ summary }: ProcurementMetricCardsProps) {
  const metrics = [
    { label: 'Orders', value: String(summary.orderCount), tone: 'text-foreground' },
    { label: 'Total Amount', value: formatCurrency(summary.totalAmount), tone: 'text-foreground' },
    { label: 'Paid (Completed)', value: formatCurrency(summary.paidAmount), tone: 'text-income' },
    { label: 'Pending', value: formatCurrency(summary.pendingAmount), tone: 'text-expense' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
