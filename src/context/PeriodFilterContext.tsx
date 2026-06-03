import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MonthFilter, YearFilter } from '@/types/transaction';

type PeriodFilterContextValue = {
  month: MonthFilter;
  year: YearFilter;
  setMonth: (month: MonthFilter) => void;
  setYear: (year: YearFilter) => void;
  setPeriod: (period: { month: number; year: number }) => void;
};

const PeriodFilterContext = createContext<PeriodFilterContextValue | null>(null);

export function PeriodFilterProvider({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState<MonthFilter>('all');
  const [year, setYear] = useState<YearFilter>(currentYear);

  const setPeriod = useCallback((period: { month: number; year: number }) => {
    setMonth(period.month);
    setYear(period.year);
  }, []);

  const value = useMemo(
    () => ({
      month,
      year,
      setMonth,
      setYear,
      setPeriod,
    }),
    [month, year, setPeriod],
  );

  return <PeriodFilterContext.Provider value={value}>{children}</PeriodFilterContext.Provider>;
}

export function usePeriodFilter(): PeriodFilterContextValue {
  const context = useContext(PeriodFilterContext);
  if (!context) {
    throw new Error('usePeriodFilter must be used within PeriodFilterProvider');
  }
  return context;
}
