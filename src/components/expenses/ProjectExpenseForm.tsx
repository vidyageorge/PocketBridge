import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { EMPLOYEE_EXPENSE_CATEGORIES } from '@/lib/constants';
import { defaultExpensePaymentDate, getProjectCodes } from '@/lib/expense';
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

const DEFAULT_PROJECT_CODES = ['P-01', 'P-02', 'P-03', 'P-04', 'Company'];

type ProjectExpenseFormProps = {
  month: number;
  year: number;
};

/**
 * Form to add a project expense line for the selected month.
 */
export function ProjectExpenseForm({ month, year }: ProjectExpenseFormProps) {
  const { data, addProjectExpense } = useExpenses();
  const [projectCode, setProjectCode] = useState('P-01');
  const [paymentDate, setPaymentDate] = useState(() => defaultExpensePaymentDate(month, year));
  const [description, setDescription] = useState<string>(EMPLOYEE_EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setPaymentDate(defaultExpensePaymentDate(month, year));
  }, [month, year]);

  const knownProjectCodes = useMemo(() => {
    const fromData = getProjectCodes(data.project);
    return [...new Set([...DEFAULT_PROJECT_CODES, ...fromData])].sort();
  }, [data.project]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCode = projectCode.trim();
    const parsedAmount = Number(amount);

    if (!trimmedCode || !paymentDate || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const [dateYear, dateMonth] = paymentDate.split('-').map(Number);
    if (dateMonth !== month || dateYear !== year) {
      window.alert(`Date must fall in ${month}/${year} for the selected period.`);
      return;
    }

    addProjectExpense({
      sheetMonth: month,
      sheetYear: year,
      sheetName: '',
      sno: '',
      description,
      projectCode: trimmedCode,
      paymentDate,
      amount: parsedAmount,
      income: 0,
      cumulativeTotal: 0,
    });

    setAmount('');
    setPaymentDate(defaultExpensePaymentDate(month, year));
  };

  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add project expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="project-code">Project</Label>
            <Input
              id="project-code"
              list="project-code-suggestions"
              value={projectCode}
              onChange={(event) => setProjectCode(event.target.value)}
              placeholder="e.g. P-01"
              required
            />
            <datalist id="project-code-suggestions">
              {knownProjectCodes.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-payment-date">Date</Label>
            <Input
              id="project-payment-date"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-expense-type">Type</Label>
            <Select value={description} onValueChange={setDescription}>
              <SelectTrigger id="project-expense-type">
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
            <Label htmlFor="project-amount">Amount (₹)</Label>
            <Input
              id="project-amount"
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
