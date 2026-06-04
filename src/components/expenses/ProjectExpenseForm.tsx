import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { defaultExpensePaymentDate, getProjectCodes } from '@/lib/expense';
import { useCustomOptions } from '@/context/CustomOptionsContext';
import { useExpenses } from '@/context/ExpenseContext';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProjectExpenseRecord } from '@/types/expense';

type ProjectExpenseFormProps = {
  month: number;
  year: number;
  editingRecord?: ProjectExpenseRecord | null;
  onCancelEdit?: () => void;
};

/**
 * Form to add or edit a project expense line for the selected month.
 */
export function ProjectExpenseForm({
  month,
  year,
  editingRecord = null,
  onCancelEdit,
}: ProjectExpenseFormProps) {
  const { data, addProjectExpense, updateProjectExpense } = useExpenses();
  const { getOptions, addOption } = useCustomOptions();
  const expenseTypes = getOptions('employeeExpenseCategories');
  const isEditing = editingRecord !== null;
  const knownProjectCodes = useMemo(
    () => getOptions('projectCodes', getProjectCodes(data.project)),
    [data.project, getOptions],
  );
  const [projectCode, setProjectCode] = useState(knownProjectCodes[0] ?? 'P-01');
  const [paymentDate, setPaymentDate] = useState(() => defaultExpensePaymentDate(month, year));
  const [description, setDescription] = useState(expenseTypes[0] ?? '');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!editingRecord) {
      setPaymentDate(defaultExpensePaymentDate(month, year));
      return;
    }

    setProjectCode(editingRecord.projectCode);
    setPaymentDate(editingRecord.paymentDate || defaultExpensePaymentDate(month, year));
    setDescription(editingRecord.description);
    setAmount(String(editingRecord.amount));
  }, [editingRecord, month, year]);

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

    if (isEditing && editingRecord) {
      updateProjectExpense({
        ...editingRecord,
        description,
        projectCode: trimmedCode,
        paymentDate,
        amount: parsedAmount,
      });
      onCancelEdit?.();
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
        <CardTitle className="text-base">
          {isEditing ? 'Edit project expense' : 'Add project expense'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="project-code">Project</Label>
            <CreatableSelect
              id="project-code"
              value={projectCode}
              onValueChange={setProjectCode}
              options={knownProjectCodes}
              onAddOption={(label) =>
                addOption('projectCodes', label, getProjectCodes(data.project))
              }
              placeholder="Select project"
              addLabel="Add new project code"
            />
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
            <CreatableSelect
              id="project-expense-type"
              value={description}
              onValueChange={setDescription}
              options={expenseTypes}
              onAddOption={(label) => addOption('employeeExpenseCategories', label)}
              addLabel="Add new type"
            />
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
