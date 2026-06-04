import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { useExpenses } from '@/context/ExpenseContext';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
import { useProcurement } from '@/context/ProcurementContext';
import { useTransactions } from '@/context/TransactionContext';
import {
  getAvailablePeriodYears,
  getPreferredDashboardYear,
  yearHasProcurementData,
} from '@/lib/periodFilter';

/**
 * Aligns the shared dashboard period with years that exist in loaded data.
 */
export function PeriodFilterBootstrap({ children }: { children: ReactNode }) {
  const { year, setYear } = usePeriodFilter();
  const { transactions } = useTransactions();
  const { records: procurement } = useProcurement();
  const { data: expenses } = useExpenses();
  const { records: clientPayments } = useClientPayments();
  const hasInitialized = useRef(false);

  const availableYears = useMemo(
    () =>
      getAvailablePeriodYears(
        transactions,
        procurement,
        expenses.project,
        expenses.employee,
        clientPayments,
      ),
    [transactions, procurement, expenses.project, expenses.employee, clientPayments],
  );

  const preferredYear = useMemo(
    () =>
      getPreferredDashboardYear(
        transactions,
        procurement,
        expenses.project,
        expenses.employee,
        clientPayments,
      ),
    [transactions, procurement, expenses.project, expenses.employee, clientPayments],
  );

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    if (year === 'all') {
      return;
    }

    if (!availableYears.includes(year)) {
      setYear(preferredYear);
      return;
    }

    if (procurement.length > 0 && !yearHasProcurementData(procurement, year)) {
      setYear(preferredYear);
    }
  }, [
    availableYears,
    preferredYear,
    procurement,
    year,
    setYear,
  ]);

  return children;
}
