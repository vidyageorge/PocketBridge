import { useState, type FormEvent } from 'react';
import { CATEGORIES } from '@/lib/constants';
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
import type { TransactionSource, TransactionType } from '@/types/transaction';

type TransactionFormProps = {
  source: TransactionSource;
  onSubmit: (transaction: {
    date: string;
    desc: string;
    cat: string;
    type: TransactionType;
    amount: number;
  }) => void;
};

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  desc: '',
  cat: 'Food',
  type: 'expense' as TransactionType,
  amount: '',
};

export function TransactionForm({ source, onSubmit }: TransactionFormProps) {
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(form.amount);
    if (!form.desc.trim() || !form.date || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    onSubmit({
      date: form.date,
      desc: form.desc.trim(),
      cat: form.cat,
      type: form.type,
      amount,
    });

    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add {source === 'bank' ? 'Bank' : 'Cash'} Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor={`${source}-date`}>Date</Label>
            <Input
              id={`${source}-date`}
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              required
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <Label htmlFor={`${source}-desc`}>Description</Label>
            <Input
              id={`${source}-desc`}
              value={form.desc}
              onChange={(event) => setForm((current) => ({ ...current, desc: event.target.value }))}
              placeholder="What was this for?"
              required
            />
          </div>

          <div>
            <Label htmlFor={`${source}-cat`}>Category</Label>
            <Select
              value={form.cat}
              onValueChange={(value) => setForm((current) => ({ ...current, cat: value }))}
            >
              <SelectTrigger id={`${source}-cat`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`${source}-type`}>Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, type: value as TransactionType }))
              }
            >
              <SelectTrigger id={`${source}-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`${source}-amount`}>Amount (₹)</Label>
            <Input
              id={`${source}-amount`}
              type="number"
              min="1"
              step="1"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              placeholder="0"
              required
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" className="w-full sm:w-auto">
              Add Transaction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
