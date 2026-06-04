import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  filterBySheetPeriod,
  filterClientPaymentsByPeriod,
  getMonthlyIncomeAndSpend,
  getPortfolioCounts,
  getTopSpendingArea,
} from '@/lib/dashboardAggregates';
import { countUniqueSuppliers } from '@/lib/procurement';
import { computeSummary, filterTransactions } from '@/lib/filters';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { useExpenses } from '@/context/ExpenseContext';
import { useProcurement } from '@/context/ProcurementContext';
import { useDashboardPeriod } from '@/context/DashboardPeriodContext';
import { filterTransactionsThroughAsOn } from '@/lib/dashboardPeriod';
import { useTransactions } from '@/context/TransactionContext';
import { DashboardAnswerCard } from '@/components/dashboard/DashboardAnswerCard';
import { AccountBalanceCards } from '@/components/dashboard/AccountBalanceCards';
import { MonthlyIncomeExpenseChart } from '@/components/dashboard/MonthlyIncomeExpenseChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type OverviewDashboardPanelProps = {
  /** When false, balance and activity blocks are omitted (shown in Bank + Cash above). */
  showMoneySections?: boolean;
  onOpenProjectsPage: () => void;
  onOpenClientsPage: () => void;
  onOpenEmployeesPage: () => void;
  onOpenSuppliersPage: () => void;
};

/**
 * At-a-glance summary for projects, clients, team, money, and spending.
 */
export function OverviewDashboardPanel({
  showMoneySections = true,
  onOpenProjectsPage,
  onOpenClientsPage,
  onOpenEmployeesPage,
  onOpenSuppliersPage,
}: OverviewDashboardPanelProps) {
  const { transactions } = useTransactions();
  const { records: clientPayments } = useClientPayments();
  const { data: expenses } = useExpenses();
  const { records: procurement, supplierRegistry } = useProcurement();
  const { month, year, asOnDate } = useDashboardPeriod();

  const portfolio = useMemo(
    () => getPortfolioCounts(clientPayments, expenses.project, expenses.employee),
    [clientPayments, expenses.project, expenses.employee],
  );

  const filteredTransactions = useMemo(() => {
    const throughAsOn = filterTransactionsThroughAsOn(transactions, asOnDate);
    return filterTransactions(throughAsOn, month, year);
  }, [transactions, month, year, asOnDate]);

  const moneySummary = useMemo(() => computeSummary(filteredTransactions), [filteredTransactions]);

  const filteredProcurement = useMemo(
    () => filterBySheetPeriod(procurement, month, year),
    [procurement, month, year],
  );

  const filteredProjectExpenses = useMemo(
    () => filterBySheetPeriod(expenses.project, month, year),
    [expenses.project, month, year],
  );

  const filteredEmployeeExpenses = useMemo(
    () => filterBySheetPeriod(expenses.employee, month, year),
    [expenses.employee, month, year],
  );

  const topSpending = useMemo(
    () =>
      getTopSpendingArea(
        transactions,
        filteredProcurement,
        filteredProjectExpenses,
        filteredEmployeeExpenses,
        month,
        year,
      ),
    [
      transactions,
      filteredProcurement,
      filteredProjectExpenses,
      filteredEmployeeExpenses,
      month,
      year,
    ],
  );

  const clientReceipts = useMemo(() => {
    const filtered = filterClientPaymentsByPeriod(clientPayments, month, year);
    return filtered.reduce((sum, record) => sum + record.amount, 0);
  }, [clientPayments, month, year]);

  const supplierCount = useMemo(
    () => countUniqueSuppliers(procurement, supplierRegistry),
    [procurement, supplierRegistry],
  );

  const procurementSpend = useMemo(
    () => filteredProcurement.reduce((sum, record) => sum + record.amount, 0),
    [filteredProcurement],
  );

  const monthlyMoneyFlow = useMemo(() => {
    const throughAsOn = filterTransactionsThroughAsOn(transactions, asOnDate);
    return getMonthlyIncomeAndSpend(throughAsOn, 'all');
  }, [transactions, asOnDate]);

  const monthlyYearLabel = 'through latest record';

  const projectLabel = portfolio.projectCount === 1 ? 'project' : 'projects';
  const clientLabel = portfolio.clientCount === 1 ? 'client' : 'clients';
  const employeeLabel = portfolio.employeeCount === 1 ? 'team member' : 'team members';
  const supplierLabel = supplierCount === 1 ? 'supplier' : 'suppliers';

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-white/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardAnswerCard
              label="Projects"
              answer={`${portfolio.projectCount} ${projectLabel}`}
              onClick={onOpenProjectsPage}
            />
            <DashboardAnswerCard
              label="Clients"
              answer={`${portfolio.clientCount} ${clientLabel}`}
              onClick={onOpenClientsPage}
            />
            <DashboardAnswerCard
              label="Team members"
              answer={`${portfolio.employeeCount} ${employeeLabel}`}
              onClick={onOpenEmployeesPage}
            />
            <DashboardAnswerCard
              label="Suppliers"
              answer={`${supplierCount} ${supplierLabel}`}
              onClick={onOpenSuppliersPage}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Procurement spend this period:{' '}
            <span className="font-medium text-expense">{formatCurrency(procurementSpend)}</span>
          </p>
        </CardContent>
      </Card>

      {showMoneySections && (
        <>
          <AccountBalanceCards title="Bank + cash (closing balances)" />

          <Card className="border-border/80 bg-white/95">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity this period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <DashboardAnswerCard
                  label="Money received"
                  answer={formatCurrency(moneySummary.totalIncome)}
                  tone="text-income"
                />
                <DashboardAnswerCard
                  label="Money spent"
                  answer={formatCurrency(moneySummary.totalExpenses)}
                  tone="text-expense"
                />
                <DashboardAnswerCard
                  label="Net flow"
                  answer={formatCurrency(moneySummary.netBalance)}
                  tone={
                    moneySummary.netBalance >= 0 ? 'text-income' : 'text-expense'
                  }
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Client payments this period:{' '}
                <span className="font-medium text-income">
                  {formatCurrency(clientReceipts)}
                </span>
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {!showMoneySections && (
        <Card className="border-border/80 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Client payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Received this period:{' '}
              <span className="font-medium text-income">
                {formatCurrency(clientReceipts)}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      <MonthlyIncomeExpenseChart data={monthlyMoneyFlow} yearLabel={monthlyYearLabel} />

      <Card className="border-border/80 bg-white/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top spending</CardTitle>
        </CardHeader>
        <CardContent>
          {topSpending ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Largest spend</p>
              <p className="mt-1 text-xl font-semibold">{topSpending.label}</p>
              <p className="mt-1 text-2xl font-semibold text-expense">
                {formatCurrency(topSpending.amount)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{topSpending.source}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No spending recorded for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
