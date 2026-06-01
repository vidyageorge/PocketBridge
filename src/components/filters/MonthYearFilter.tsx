import { MONTHS } from '@/lib/constants';
import { getAvailableYears } from '@/lib/filters';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MonthFilter, Transaction, YearFilter } from '@/types/transaction';

type MonthYearFilterProps = {
  month: MonthFilter;
  year: YearFilter;
  transactions: Transaction[];
  onMonthChange: (month: MonthFilter) => void;
  onYearChange: (year: YearFilter) => void;
};

export function MonthYearFilter({
  month,
  year,
  transactions,
  onMonthChange,
  onYearChange,
}: MonthYearFilterProps) {
  const years = getAvailableYears(transactions);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full sm:w-40">
        <Label htmlFor="month-filter">Month</Label>
        <Select
          value={month === 'all' ? 'all' : String(month)}
          onValueChange={(value) =>
            onMonthChange(value === 'all' ? 'all' : Number(value))
          }
        >
          <SelectTrigger id="month-filter">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {MONTHS.map((monthOption) => (
              <SelectItem key={monthOption.value} value={String(monthOption.value)}>
                {monthOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-32">
        <Label htmlFor="year-filter">Year</Label>
        <Select
          value={year === 'all' ? 'all' : String(year)}
          onValueChange={(value) =>
            onYearChange(value === 'all' ? 'all' : Number(value))
          }
        >
          <SelectTrigger id="year-filter">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {years.map((yearOption) => (
              <SelectItem key={yearOption} value={String(yearOption)}>
                {yearOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
