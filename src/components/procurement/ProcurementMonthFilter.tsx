import { MONTHS } from '@/lib/constants';
import { getLatestMonthForYear, getProcurementMonthsForYear, getProcurementYears } from '@/lib/procurement';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProcurementRecord } from '@/types/procurement';

type ProcurementMonthFilterProps = {
  month: number;
  year: number;
  records: ProcurementRecord[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

export function ProcurementMonthFilter({
  month,
  year,
  records,
  onMonthChange,
  onYearChange,
}: ProcurementMonthFilterProps) {
  const years = getProcurementYears(records);
  const months = getProcurementMonthsForYear(records, year);

  const handleYearChange = (value: string) => {
    const nextYear = Number(value);
    onYearChange(nextYear);
    onMonthChange(getLatestMonthForYear(records, nextYear));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full sm:w-48">
        <Label htmlFor="procurement-month">Month</Label>
        <Select value={String(month)} onValueChange={(value) => onMonthChange(Number(value))}>
          <SelectTrigger id="procurement-month">
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
        <Label htmlFor="procurement-year">Year</Label>
        <Select value={String(year)} onValueChange={handleYearChange}>
          <SelectTrigger id="procurement-year">
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
