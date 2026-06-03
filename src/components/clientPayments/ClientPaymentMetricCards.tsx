import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClientPaymentSummary } from '@/types/clientPayment';

type ClientPaymentMetricCardsProps = {
  summary: ClientPaymentSummary;
};

export function ClientPaymentMetricCards({ summary }: ClientPaymentMetricCardsProps) {
  const metrics = [
    { label: 'Payments', value: String(summary.paymentCount), tone: 'text-foreground' },
    { label: 'Total Received', value: formatCurrency(summary.totalAmount), tone: 'text-income' },
    { label: 'Via Banking', value: formatCurrency(summary.totalBanking), tone: 'text-foreground' },
    { label: 'Via Cash', value: formatCurrency(summary.totalCash), tone: 'text-foreground' },
    { label: 'Via GPay', value: formatCurrency(summary.totalGpay), tone: 'text-foreground' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
