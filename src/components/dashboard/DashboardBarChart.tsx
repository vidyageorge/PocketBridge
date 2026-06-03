import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BRAND_COLORS } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import type { DashboardBreakdownRow } from '@/lib/dashboardAggregates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardBarChartProps = {
  title: string;
  data: DashboardBreakdownRow[];
  emptyMessage?: string;
  barColor?: string;
};

/**
 * Horizontal bar-style breakdown chart for dashboard aggregates.
 */
export function DashboardBarChart({
  title,
  data,
  emptyMessage = 'No data for the selected period.',
  barColor = BRAND_COLORS.chartTeal,
}: DashboardBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="amount" fill={barColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
