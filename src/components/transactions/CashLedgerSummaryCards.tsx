import { formatCurrency } from '@/lib/currency';
import type { CashLedgerSummary } from '@/lib/cashLedger';
import { DashboardAnswerCard } from '@/components/dashboard/DashboardAnswerCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type CashLedgerSummaryCardsProps = {
  summary: CashLedgerSummary;
};

/**
 * Shows cash received, petty cash spent, and net remaining for the petty cash ledger.
 */
export function CashLedgerSummaryCards({ summary }: CashLedgerSummaryCardsProps) {
  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Petty cash summary</CardTitle>
      </CardHeader>
      <CardContent>
        {summary.entryCount === 0 ? (
          <p className="text-sm text-muted-foreground">No cash entries for this period.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardAnswerCard
              label="Received from clients"
              answer={formatCurrency(summary.receivedFromClients)}
              tone="text-income"
            />
            <DashboardAnswerCard
              label="Petty cash spent"
              answer={formatCurrency(summary.pettyCashSpent)}
              tone="text-expense"
            />
            <DashboardAnswerCard
              label="Net remaining"
              answer={formatCurrency(summary.netRemaining)}
              tone={summary.netRemaining >= 0 ? 'text-income' : 'text-expense'}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
