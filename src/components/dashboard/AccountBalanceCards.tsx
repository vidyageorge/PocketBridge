import { useContext, useMemo } from 'react';
import { formatCurrency, formatIndianAmountUnit } from '@/lib/currency';
import { getBankBalanceAsOn, getCashBalanceAsOn } from '@/lib/accountBalance';
import { DashboardPeriodContext } from '@/context/DashboardPeriodContext';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { useTransactions } from '@/context/TransactionContext';
import { DashboardAnswerCard } from '@/components/dashboard/DashboardAnswerCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AccountBalanceCardsProps = {
  title?: string;
  showBank?: boolean;
  showCash?: boolean;
  showCombined?: boolean;
};

/**
 * Shows bank and cash balances for the selected period.
 */
export function AccountBalanceCards({
  title = 'Money on hand',
  showBank = true,
  showCash = true,
  showCombined = true,
}: AccountBalanceCardsProps) {
  const { transactions, balanceSnapshots } = useTransactions();
  const dashboardPeriod = useContext(DashboardPeriodContext);
  const periodFilter = usePeriodFilter();
  const month = dashboardPeriod?.month ?? periodFilter.month;
  const year = dashboardPeriod?.year ?? periodFilter.year;
  const asOnDate = dashboardPeriod?.asOnDate ?? null;

  const bankBalance = useMemo(
    () => getBankBalanceAsOn(transactions, balanceSnapshots, month, year, asOnDate),
    [transactions, balanceSnapshots, month, year, asOnDate],
  );

  const cashBalance = useMemo(
    () => getCashBalanceAsOn(transactions, month, year, asOnDate),
    [transactions, month, year, asOnDate],
  );

  const combinedBalance = (bankBalance?.balance ?? 0) + (cashBalance?.balance ?? 0);
  const hasAnyBalance =
    (showBank && bankBalance !== null) || (showCash && cashBalance !== null);

  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyBalance ? (
          <p className="text-sm text-muted-foreground">
            No closing balance for this period.
          </p>
        ) : (
          <div
            className={`grid gap-4 ${
              showCombined && showBank && showCash
                ? 'sm:grid-cols-2 lg:grid-cols-3'
                : 'sm:grid-cols-2'
            }`}
          >
            {showBank && (
              <DashboardAnswerCard
                label="Bank"
                answer={bankBalance ? formatCurrency(bankBalance.balance) : '—'}
                unitLabel={
                  bankBalance ? formatIndianAmountUnit(bankBalance.balance) : undefined
                }
                tone="text-income"
              />
            )}
            {showCash && (
              <DashboardAnswerCard
                label="Cash"
                answer={cashBalance ? formatCurrency(cashBalance.balance) : '—'}
                unitLabel={
                  cashBalance ? formatIndianAmountUnit(cashBalance.balance) : undefined
                }
                tone={
                  cashBalance && cashBalance.balance >= 0 ? 'text-income' : 'text-expense'
                }
              />
            )}
            {showCombined && showBank && showCash && (
              <DashboardAnswerCard
                label="Bank + cash"
                answer={formatCurrency(combinedBalance)}
                unitLabel={formatIndianAmountUnit(combinedBalance)}
                tone={combinedBalance >= 0 ? 'text-income' : 'text-expense'}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
