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
import { formatCurrency, formatIndianChartAxis } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BankCashChartProps = {
  data: { source: string; amount: number; net: number }[];
};

export function BankCashChart({ data }: BankCashChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank vs Cash Split</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="source" />
              <YAxis tickFormatter={(value) => formatIndianChartAxis(Number(value))} />
              <Tooltip
                formatter={(value, _name, item) => {
                  const net = (item?.payload as { net?: number })?.net ?? 0;
                  return [`${formatCurrency(Number(value ?? 0))} (net: ${formatCurrency(net)})`, 'Volume'];
                }}
              />
              <Bar dataKey="amount" fill={BRAND_COLORS.chartGold} radius={[4, 4, 0, 0]} name="Volume" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
