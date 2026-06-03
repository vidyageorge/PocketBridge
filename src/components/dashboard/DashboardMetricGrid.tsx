import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type DashboardMetric = {
  label: string;
  value: string;
  tone?: string;
};

type DashboardMetricGridProps = {
  metrics: DashboardMetric[];
  columns?: 2 | 3 | 4 | 5;
};

const COLUMN_CLASS: Record<NonNullable<DashboardMetricGridProps['columns']>, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-5',
};

/**
 * Responsive metric cards shared across dashboard sub-views.
 */
export function DashboardMetricGrid({ metrics, columns = 4 }: DashboardMetricGridProps) {
  return (
    <div className={`grid gap-4 ${COLUMN_CLASS[columns]}`}>
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${metric.tone ?? 'text-foreground'}`}>
              {metric.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
