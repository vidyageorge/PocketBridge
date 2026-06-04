import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  getDashboardPeriodFromTransactions,
  type DashboardPeriod,
} from '@/lib/dashboardPeriod';
import { useTransactions } from '@/context/TransactionContext';

export const DashboardPeriodContext = createContext<DashboardPeriod | null>(null);

/**
 * Supplies dashboard period from the last inserted bank/cash record (not user filters).
 */
export function DashboardPeriodProvider({ children }: { children: ReactNode }) {
  const { transactions } = useTransactions();

  const period = useMemo(
    () => getDashboardPeriodFromTransactions(transactions),
    [transactions],
  );

  return (
    <DashboardPeriodContext.Provider value={period}>
      {children}
    </DashboardPeriodContext.Provider>
  );
}

export function useDashboardPeriod(): DashboardPeriod {
  const context = useContext(DashboardPeriodContext);
  if (!context) {
    throw new Error('useDashboardPeriod must be used within DashboardPeriodProvider');
  }
  return context;
}
