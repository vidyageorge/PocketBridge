import { useMemo, useState } from 'react';
import { getLatestExpensePeriod } from '@/lib/expense';
import { useExpenses } from '@/context/ExpenseContext';
import { EmployeeExpensePanel } from '@/components/expenses/EmployeeExpensePanel';
import { ExpenseImport } from '@/components/expenses/ExpenseImport';
import { ExpenseMonthFilter } from '@/components/expenses/ExpenseMonthFilter';
import { ProjectExpensePanel } from '@/components/expenses/ProjectExpensePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ExpenseTab() {
  const { data } = useExpenses();
  const allPeriodRecords = useMemo(
    () => [...data.project, ...data.employee],
    [data.project, data.employee],
  );
  const defaultPeriod = useMemo(() => getLatestExpensePeriod(allPeriodRecords), [allPeriodRecords]);

  const [month, setMonth] = useState(defaultPeriod.month);
  const [year, setYear] = useState(defaultPeriod.year);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Expense</h2>

      <ExpenseImport />

      <ExpenseMonthFilter
        month={month}
        year={year}
        periodRecords={allPeriodRecords}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      <Tabs defaultValue="project" className="w-full">
        <TabsList>
          <TabsTrigger value="project">Project Expense</TabsTrigger>
          <TabsTrigger value="employee">Employee Expense</TabsTrigger>
        </TabsList>

        <TabsContent value="project">
          <ProjectExpensePanel month={month} year={year} />
        </TabsContent>

        <TabsContent value="employee">
          <EmployeeExpensePanel month={month} year={year} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
