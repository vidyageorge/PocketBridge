import { MONTHS } from '@/lib/constants';
import { getExpenseMonthsForYear, getExpenseYears, getLatestMonthForYear } from '@/lib/expense';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ExpenseMonthFilterProps = {
  month: number;
  year: number;
  periodRecords: { sheetMonth: number; sheetYear: number }[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

export function ExpenseMonthFilter({
  month,
  year,
  periodRecords,
  onMonthChange,
  onYearChange,
}: ExpenseMonthFilterProps) {
  const years = getExpenseYears(periodRecords);
  const months = getExpenseMonthsForYear(periodRecords, year);

  const handleYearChange = (value: string) => {
    const nextYear = Number(value);
    onYearChange(nextYear);
    onMonthChange(getLatestMonthForYear(periodRecords, nextYear));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full sm:w-48">
        <Label htmlFor="expense-month">Month</Label>
        <Select value={String(month)} onValueChange={(value) => onMonthChange(Number(value))}>
          <SelectTrigger id="expense-month">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((monthValue) => {
              const label = MONTHS.find((monthOption) => monthOption.value === monthValue)?.label;
              return (
                <SelectItem key={monthValue} value={String(monthValue)}>
                  {label ?? monthValue}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-32">
        <Label htmlFor="expense-year">Year</Label>
        <Select value={String(year)} onValueChange={handleYearChange}>
          <SelectTrigger id="expense-year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((yearValue) => (
              <SelectItem key={yearValue} value={String(yearValue)}>
                {yearValue}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
