import { useMemo, useState, type FormEvent } from 'react';
import { getClientList } from '@/lib/clientPayment';
import { CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/constants';
import { useClientPayments } from '@/context/ClientPaymentContext';
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

type CashEntryKind = 'payment' | 'expense';

type TransactionFormProps = {
  source: TransactionSource;
  onSubmit: (transaction: {
    date: string;
    desc: string;
    clientName?: string;
    spentBy?: string;
    cat: string;
    type: TransactionType;
    amount: number;
  }) => void;
};

const emptyCashForm = {
  date: new Date().toISOString().slice(0, 10),
  entryKind: 'expense' as CashEntryKind,
  clientName: '',
  spentBy: '',
  desc: '',
  cat: 'Food',
  amount: '',
};

const emptyBankForm = {
  date: new Date().toISOString().slice(0, 10),
  desc: '',
  cat: 'Food',
  type: 'expense' as TransactionType,
  amount: '',
};

export function TransactionForm({ source, onSubmit }: TransactionFormProps) {
  const { records, registry } = useClientPayments();
  const clients = useMemo(() => getClientList(records, registry), [records, registry]);
  const [cashForm, setCashForm] = useState(emptyCashForm);
  const [bankForm, setBankForm] = useState(emptyBankForm);

  const handleCashSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(cashForm.amount);
    if (!cashForm.date || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const isPayment = cashForm.entryKind === 'payment';
    const clientName = cashForm.clientName.trim();

    if (isPayment && !clientName) {
      return;
    }

    const description =
      cashForm.desc.trim() ||
      (isPayment ? `Cash payment — ${clientName}` : '');

    if (!description) {
      return;
    }

    onSubmit({
      date: cashForm.date,
      desc: description,
      clientName: isPayment ? clientName : undefined,
      spentBy: isPayment ? undefined : cashForm.spentBy.trim() || undefined,
      cat: isPayment ? 'Client Payment' : cashForm.cat,
      type: isPayment ? 'income' : 'expense',
      amount,
    });

    setCashForm({
      ...emptyCashForm,
      date: new Date().toISOString().slice(0, 10),
      clientName: clients[0]?.clientName ?? '',
    });
  };

  const handleBankSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(bankForm.amount);
    if (!bankForm.desc.trim() || !bankForm.date || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    onSubmit({
      date: bankForm.date,
      desc: bankForm.desc.trim(),
      cat: bankForm.cat,
      type: bankForm.type,
      amount,
    });

    setBankForm({ ...emptyBankForm, date: new Date().toISOString().slice(0, 10) });
  };

  if (source === 'cash') {
    const isPayment = cashForm.entryKind === 'payment';
    const expenseCategories = EXPENSE_CATEGORIES as readonly string[];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Add Cash Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCashSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="cash-date">Date</Label>
              <Input
                id="cash-date"
                type="date"
                value={cashForm.date}
                onChange={(event) =>
                  setCashForm((current) => ({ ...current, date: event.target.value }))
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="cash-entry-kind">Type</Label>
              <Select
                value={cashForm.entryKind}
                onValueChange={(value) =>
                  setCashForm((current) => ({
                    ...current,
                    entryKind: value as CashEntryKind,
                    cat: value === 'payment' ? 'Client Payment' : current.cat,
                    clientName:
                      value === 'payment' && !current.clientName
                        ? (clients[0]?.clientName ?? '')
                        : current.clientName,
                  }))
                }
              >
                <SelectTrigger id="cash-entry-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Payment (from client)</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isPayment && (
              <div>
                <Label htmlFor="cash-client">Client</Label>
                {clients.length > 0 ? (
                  <Select
                    value={cashForm.clientName || clients[0]?.clientName}
                    onValueChange={(value) =>
                      setCashForm((current) => ({ ...current, clientName: value }))
                    }
                  >
                    <SelectTrigger id="cash-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.clientName} value={client.clientName}>
                          {client.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="cash-client"
                    value={cashForm.clientName}
                    onChange={(event) =>
                      setCashForm((current) => ({ ...current, clientName: event.target.value }))
                    }
                    placeholder="Client name"
                    required
                  />
                )}
              </div>
            )}

            <div className={isPayment ? 'sm:col-span-2' : 'sm:col-span-2 lg:col-span-1'}>
              <Label htmlFor="cash-desc">Description</Label>
              <Input
                id="cash-desc"
                value={cashForm.desc}
                onChange={(event) =>
                  setCashForm((current) => ({ ...current, desc: event.target.value }))
                }
                placeholder={
                  isPayment ? 'Optional — defaults to cash payment from client' : 'What was this for?'
                }
                required={!isPayment}
              />
            </div>

            {!isPayment && (
              <div>
                <Label htmlFor="cash-spent-by">Spent by</Label>
                <Input
                  id="cash-spent-by"
                  value={cashForm.spentBy}
                  onChange={(event) =>
                    setCashForm((current) => ({ ...current, spentBy: event.target.value }))
                  }
                  placeholder="Who spent this cash?"
                />
              </div>
            )}

            {!isPayment && (
              <div>
                <Label htmlFor="cash-cat">Category</Label>
                <Select
                  value={cashForm.cat}
                  onValueChange={(value) =>
                    setCashForm((current) => ({ ...current, cat: value }))
                  }
                >
                  <SelectTrigger id="cash-cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="cash-amount">Amount (₹)</Label>
              <Input
                id="cash-amount"
                type="number"
                min="1"
                step="1"
                value={cashForm.amount}
                onChange={(event) =>
                  setCashForm((current) => ({ ...current, amount: event.target.value }))
                }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Bank Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBankSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor={`${source}-date`}>Date</Label>
            <Input
              id={`${source}-date`}
              type="date"
              value={bankForm.date}
              onChange={(event) =>
                setBankForm((current) => ({ ...current, date: event.target.value }))
              }
              required
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <Label htmlFor={`${source}-desc`}>Description</Label>
            <Input
              id={`${source}-desc`}
              value={bankForm.desc}
              onChange={(event) =>
                setBankForm((current) => ({ ...current, desc: event.target.value }))
              }
              placeholder="What was this for?"
              required
            />
          </div>

          <div>
            <Label htmlFor={`${source}-cat`}>Category</Label>
            <Select
              value={bankForm.cat}
              onValueChange={(value) => setBankForm((current) => ({ ...current, cat: value }))}
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
              value={bankForm.type}
              onValueChange={(value) =>
                setBankForm((current) => ({ ...current, type: value as TransactionType }))
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
              value={bankForm.amount}
              onChange={(event) =>
                setBankForm((current) => ({ ...current, amount: event.target.value }))
              }
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
