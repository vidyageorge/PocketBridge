import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BRAND_COLORS } from '@/lib/constants';
import { formatCurrency, formatIndianChartAxis } from '@/lib/currency';
import type { MonthlyMoneyFlow } from '@/lib/dashboardAggregates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MonthlyIncomeExpenseChartProps = {
  data: MonthlyMoneyFlow[];
  yearLabel: string;
};

/**
 * Side-by-side monthly income and expense bars for bank + cash combined.
 */
export function MonthlyIncomeExpenseChart({ data, yearLabel }: MonthlyIncomeExpenseChartProps) {
  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Month-wise income &amp; spend</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Bank and cash combined — {yearLabel}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions for this period.
          </p>
        ) : (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    angle={-35}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatIndianChartAxis(Number(value))}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(Number(value ?? 0)),
                      name === 'income' ? 'Income' : 'Spend',
                    ]}
                  />
                  <Legend formatter={(value) => (value === 'income' ? 'Income' : 'Spend')} />
                  <Bar
                    dataKey="income"
                    name="income"
                    fill={BRAND_COLORS.chartTeal}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="expense"
                    fill={BRAND_COLORS.chartGold}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Month</th>
                    <th className="px-2 py-2 font-medium text-right">Income</th>
                    <th className="px-2 py-2 font-medium text-right">Spend</th>
                    <th className="px-2 py-2 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const balance = row.income - row.expense;
                    return (
                      <tr key={row.monthKey} className="border-b border-border/60">
                        <td className="px-2 py-2 font-medium">{row.label}</td>
                        <td className="px-2 py-2 text-right text-income">
                          {formatCurrency(row.income)}
                        </td>
                        <td className="px-2 py-2 text-right text-expense">
                          {formatCurrency(row.expense)}
                        </td>
                        <td
                          className={`px-2 py-2 text-right font-medium ${
                            balance >= 0 ? 'text-income' : 'text-expense'
                          }`}
                        >
                          {formatCurrency(balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
