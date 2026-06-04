import { useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  aggregateAmountByLabel,
  filterBySheetPeriod,
  getProcurementPaymentStatusBreakdown,
} from '@/lib/dashboardAggregates';
import {
  computeProcurementSummary,
  countUniqueSuppliers,
  getSupplierList,
  sortProcurementByOrderDateDesc,
} from '@/lib/procurement';
import { useProcurement } from '@/context/ProcurementContext';
import { useDashboardPeriod } from '@/context/DashboardPeriodContext';
import { getLatestProcurementPeriod } from '@/lib/procurement';
import { yearHasProcurementData } from '@/lib/periodFilter';
import { DashboardAnswerCard } from '@/components/dashboard/DashboardAnswerCard';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardRankedList } from '@/components/dashboard/DashboardRankedList';
import { BRAND_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Supplier spend summary for the dashboard.
 */
export function SuppliersDashboardPanel() {
  const { records, supplierRegistry } = useProcurement();
  const { month, year } = useDashboardPeriod();

  const filtered = useMemo(
    () => filterBySheetPeriod(records, month, year),
    [records, month, year],
  );

  const summary = useMemo(() => computeProcurementSummary(filtered), [filtered]);
  const supplierCount = useMemo(() => countUniqueSuppliers(filtered), [filtered]);
  const bySupplier = useMemo(
    () =>
      aggregateAmountByLabel(
        filtered.map((record) => ({ label: record.supplier, amount: record.amount })),
      ),
    [filtered],
  );

  const paymentStatus = useMemo(() => getProcurementPaymentStatusBreakdown(filtered), [filtered]);

  const topSuppliers = useMemo(
    () => getSupplierList(filtered, supplierRegistry).slice(0, 8),
    [filtered, supplierRegistry],
  );

  const recentBySupplier = useMemo(
    () => sortProcurementByOrderDateDesc(filtered).slice(0, 8),
    [filtered],
  );

  const topSupplier = bySupplier[0];
  const procurementDataYear = useMemo(
    () => (records.length > 0 ? getLatestProcurementPeriod(records).year : null),
    [records],
  );
  const showYearHint =
    records.length > 0 &&
    !yearHasProcurementData(records, year) &&
    procurementDataYear !== null;

  return (
    <div className="space-y-6">
      {showYearHint && (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No procurement for {year === 'all' ? 'this filter' : year}. Your workbook data is in{' '}
          <span className="font-medium text-foreground">{procurementDataYear}</span> — set Year to{' '}
          {procurementDataYear} (or All) in the filter above.
        </p>
      )}
      <Card className="border-border/80 bg-white/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardAnswerCard label="Suppliers" answer={String(supplierCount)} />
            <DashboardAnswerCard label="Orders" answer={String(summary.orderCount)} />
            <DashboardAnswerCard
              label="Total spent"
              answer={formatCurrency(summary.totalAmount)}
              tone="text-expense"
            />
            <DashboardAnswerCard
              label="Pending"
              answer={formatCurrency(summary.pendingAmount)}
              tone="text-expense"
            />
          </div>
          {topSupplier && (
            <p className="mt-4 text-sm text-muted-foreground">
              Top supplier:{' '}
              <span className="font-medium text-foreground">{topSupplier.label}</span> (
              {formatCurrency(topSupplier.amount)})
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardBarChart
          title="Spend by supplier"
          data={bySupplier}
          barColor={BRAND_COLORS.chartTeal}
        />
        <DashboardBarChart
          title="Paid vs still pending"
          data={paymentStatus}
          barColor={BRAND_COLORS.chartGold}
        />
      </div>

      <DashboardRankedList
        title="Top suppliers"
        rows={bySupplier}
        emptyMessage="No supplier orders for this period."
      />

      <Card className="border-border/80 bg-white/95">
        <CardHeader>
          <CardTitle className="text-base">Supplier snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          {topSuppliers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No suppliers for this period.
            </p>
          ) : (
            <div className="space-y-3">
              {topSuppliers.map((supplier) => (
                <div
                  key={supplier.supplierName}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{supplier.supplierName}</p>
                    <p className="text-sm text-muted-foreground">
                      {supplier.orderCount} orders · {supplier.projects.join(', ') || '—'}
                    </p>
                  </div>
                  <p className="font-semibold text-expense">
                    {formatCurrency(supplier.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-white/95">
        <CardHeader>
          <CardTitle className="text-base">Latest orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBySupplier.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No orders for this period.
            </p>
          ) : (
            <div className="space-y-3">
              {recentBySupplier.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{record.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.supplier} · {record.project} · {record.paymentStatus}
                    </p>
                  </div>
                  <p className="font-semibold text-expense">{formatCurrency(record.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
