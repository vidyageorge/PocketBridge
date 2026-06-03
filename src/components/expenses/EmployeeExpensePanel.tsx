import { useMemo, useState } from 'react';
import { MONTHS } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import {
  computeExpenseSummary,
  filterByPeriod,
  filterEmployeeByName,
  getEmployeeNames,
} from '@/lib/expense';
import { getDisplaySerialNumber } from '@/lib/tablePagination';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useExpenses } from '@/context/ExpenseContext';
import { TablePagination } from '@/components/ui/TablePagination';
import { ExpenseMetricCards } from '@/components/expenses/ExpenseMetricCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type EmployeeExpensePanelProps = {
  month: number;
  year: number;
};

export function EmployeeExpensePanel({ month, year }: EmployeeExpensePanelProps) {
  const { data } = useExpenses();
  const [employeeName, setEmployeeName] = useState<string>('all');

  const filteredByPeriod = useMemo(
    () => filterByPeriod(data.employee, month, year),
    [data.employee, month, year],
  );

  const displayedRecords = useMemo(
    () => filterEmployeeByName(filteredByPeriod, employeeName),
    [filteredByPeriod, employeeName],
  );

  const employeeNames = useMemo(() => getEmployeeNames(filteredByPeriod), [filteredByPeriod]);
  const { paginatedItems, page, setPage, totalPages, totalItems, pageSize } =
    useTablePagination(displayedRecords);
  const summary = useMemo(() => computeExpenseSummary(displayedRecords), [displayedRecords]);
  const monthLabel = MONTHS.find((monthOption) => monthOption.value === month)?.label ?? month;

  return (
    <div className="space-y-6">
      <div className="w-full sm:w-56">
        <Label htmlFor="employee-expense-filter">Employee</Label>
        <Select value={employeeName} onValueChange={setEmployeeName}>
          <SelectTrigger id="employee-expense-filter">
            <SelectValue placeholder="All employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {employeeNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ExpenseMetricCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>
            {monthLabel} {year} — {displayedRecords.length} employee expense lines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayedRecords.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No employee expenses for this month and filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                    <th className="px-2 py-3 font-medium">S.No</th>
                    <th className="px-2 py-3 font-medium">Description</th>
                    <th className="px-2 py-3 font-medium">Employee</th>
                    <th className="px-2 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((record, rowIndex) => (
                    <tr key={record.id} className="border-b border-border/60">
                      <td className="px-2 py-3">
                        {getDisplaySerialNumber(rowIndex, page, pageSize)}
                      </td>
                      <td className="px-2 py-3">{record.description}</td>
                      <td className="px-2 py-3 font-medium">{record.employeeName}</td>
                      <td className="px-2 py-3 text-right font-medium text-expense">
                        {formatCurrency(record.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {displayedRecords.length > 0 && (
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
