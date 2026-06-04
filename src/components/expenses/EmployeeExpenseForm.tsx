import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { EMPLOYEE_EXPENSE_CATEGORIES } from '@/lib/constants';
import { defaultExpensePaymentDate, getEmployeeNames } from '@/lib/expense';
import { useExpenses } from '@/context/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type EmployeeExpenseFormProps = {
  month: number;
  year: number;
};

/**
 * Form to add an employee expense line for the selected month.
 */
export function EmployeeExpenseForm({ month, year }: EmployeeExpenseFormProps) {
  const { data, addEmployeeExpense } = useExpenses();
  const [employeeName, setEmployeeName] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => defaultExpensePaymentDate(month, year));
  const [description, setDescription] = useState<string>(EMPLOYEE_EXPENSE_CATEGORIES[3]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setPaymentDate(defaultExpensePaymentDate(month, year));
  }, [month, year]);

  const knownEmployees = useMemo(() => getEmployeeNames(data.employee), [data.employee]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = employeeName.trim();
    const parsedAmount = Number(amount);

    if (!trimmedName || !paymentDate || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const [dateYear, dateMonth] = paymentDate.split('-').map(Number);
    if (dateMonth !== month || dateYear !== year) {
      window.alert(`Date must fall in ${month}/${year} for the selected period.`);
      return;
    }

    addEmployeeExpense({
      sheetMonth: month,
      sheetYear: year,
      sheetName: '',
      sno: '',
      description,
      employeeName: trimmedName,
      paymentDate,
      amount: parsedAmount,
      cumulativeTotal: 0,
    });

    setAmount('');
    setPaymentDate(defaultExpensePaymentDate(month, year));
  };

  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add employee payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="employee-name">Employee name</Label>
            <Input
              id="employee-name"
              list="employee-name-suggestions"
              value={employeeName}
              onChange={(event) => setEmployeeName(event.target.value)}
              placeholder="e.g. VINOTH"
              required
            />
            <datalist id="employee-name-suggestions">
              {knownEmployees.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-payment-date">Date</Label>
            <Input
              id="employee-payment-date"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-type">Type</Label>
            <Select value={description} onValueChange={setDescription}>
              <SelectTrigger id="expense-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-amount">Amount (₹)</Label>
            <Input
              id="employee-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">
              Add entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
