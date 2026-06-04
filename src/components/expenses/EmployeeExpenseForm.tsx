import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { defaultExpensePaymentDate, getEmployeeNames } from '@/lib/expense';
import { useCustomOptions } from '@/context/CustomOptionsContext';
import { useExpenses } from '@/context/ExpenseContext';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EmployeeExpenseRecord } from '@/types/expense';

type EmployeeExpenseFormProps = {
  month: number;
  year: number;
  editingRecord?: EmployeeExpenseRecord | null;
  onCancelEdit?: () => void;
};

/**
 * Form to add or edit an employee expense line for the selected month.
 */
export function EmployeeExpenseForm({
  month,
  year,
  editingRecord = null,
  onCancelEdit,
}: EmployeeExpenseFormProps) {
  const { data, addEmployeeExpense, updateEmployeeExpense } = useExpenses();
  const { getOptions, addOption } = useCustomOptions();
  const expenseTypes = getOptions('employeeExpenseCategories');
  const isEditing = editingRecord !== null;
  const [employeeName, setEmployeeName] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => defaultExpensePaymentDate(month, year));
  const [description, setDescription] = useState(expenseTypes[0] ?? '');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!editingRecord) {
      setPaymentDate(defaultExpensePaymentDate(month, year));
      return;
    }

    setEmployeeName(editingRecord.employeeName);
    setPaymentDate(editingRecord.paymentDate || defaultExpensePaymentDate(month, year));
    setDescription(editingRecord.description);
    setAmount(String(editingRecord.amount));
  }, [editingRecord, month, year]);

  const knownEmployees = useMemo(
    () => getOptions('employeeNames', getEmployeeNames(data.employee)),
    [data.employee, getOptions],
  );

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

    if (isEditing && editingRecord) {
      updateEmployeeExpense({
        ...editingRecord,
        description,
        employeeName: trimmedName,
        paymentDate,
        amount: parsedAmount,
      });
      onCancelEdit?.();
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
        <CardTitle className="text-base">
          {isEditing ? 'Edit employee payment' : 'Add employee payment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="employee-name">Employee name</Label>
            <CreatableSelect
              id="employee-name"
              value={employeeName || knownEmployees[0] || ''}
              onValueChange={setEmployeeName}
              options={knownEmployees}
              onAddOption={(label) => addOption('employeeNames', label, getEmployeeNames(data.employee))}
              placeholder="Select employee"
              addLabel="Add new name"
            />
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
            <CreatableSelect
              id="expense-type"
              value={description}
              onValueChange={setDescription}
              options={expenseTypes}
              onAddOption={(label) => addOption('employeeExpenseCategories', label)}
              addLabel="Add new type"
            />
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

          <div className="flex flex-wrap items-end gap-2">
            <Button type="submit" className="w-full sm:w-auto">
              {isEditing ? 'Save changes' : 'Add entry'}
            </Button>
            {isEditing && onCancelEdit && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
