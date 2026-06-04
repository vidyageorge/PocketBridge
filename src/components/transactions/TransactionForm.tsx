import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getClientList } from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { useCustomOptions } from '@/context/CustomOptionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Transaction, TransactionSource, TransactionType } from '@/types/transaction';

type CashEntryKind = 'payment' | 'expense';

type TransactionPayload = {
  date: string;
  desc: string;
  clientName?: string;
  spentBy?: string;
  cat: string;
  type: TransactionType;
  amount: number;
};

type TransactionFormProps = {
  source: TransactionSource;
  editingTransaction?: Transaction | null;
  onSubmit: (transaction: TransactionPayload) => void;
  onUpdate?: (transaction: Transaction) => void;
  onCancelEdit?: () => void;
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

function transactionToCashForm(transaction: Transaction) {
  const isPayment = transaction.type === 'income';
  return {
    date: transaction.date,
    entryKind: isPayment ? ('payment' as CashEntryKind) : ('expense' as CashEntryKind),
    clientName: transaction.clientName ?? '',
    spentBy: transaction.spentBy ?? '',
    desc: transaction.desc,
    cat: transaction.cat,
    amount: String(transaction.amount),
  };
}

function transactionToBankForm(transaction: Transaction) {
  return {
    date: transaction.date,
    desc: transaction.desc,
    cat: transaction.cat,
    type: transaction.type,
    amount: String(transaction.amount),
  };
}

function resetCashForm(clientNames: string[]) {
  return {
    ...emptyCashForm,
    date: new Date().toISOString().slice(0, 10),
    clientName: clientNames[0] ?? '',
  };
}

export function TransactionForm({
  source,
  editingTransaction = null,
  onSubmit,
  onUpdate,
  onCancelEdit,
}: TransactionFormProps) {
  const { records, registry, addClient } = useClientPayments();
  const { getOptions, addOption } = useCustomOptions();
  const clients = useMemo(() => getClientList(records, registry), [records, registry]);
  const clientNames = useMemo(
    () => clients.map((client) => client.clientName),
    [clients],
  );
  const expenseCategories = getOptions('expenseCategories');
  const bankCategories = getOptions('bankCategories');

  const isEditing = editingTransaction !== null;
  const activeSource = editingTransaction?.source ?? source;

  const [cashForm, setCashForm] = useState(emptyCashForm);
  const [bankForm, setBankForm] = useState(emptyBankForm);

  useEffect(() => {
    if (editingTransaction) {
      if (editingTransaction.source === 'cash') {
        setCashForm(transactionToCashForm(editingTransaction));
      } else {
        setBankForm(transactionToBankForm(editingTransaction));
      }
      return;
    }

    if (source === 'cash') {
      setCashForm(resetCashForm(clientNames));
    } else {
      setBankForm({ ...emptyBankForm, date: new Date().toISOString().slice(0, 10) });
    }
  }, [editingTransaction, source, clientNames]);

  const applyCashPayload = (payload: TransactionPayload) => {
    if (editingTransaction && onUpdate) {
      onUpdate({ ...editingTransaction, ...payload });
      onCancelEdit?.();
      return;
    }

    onSubmit(payload);
    setCashForm(resetCashForm(clientNames));
  };

  const applyBankPayload = (payload: TransactionPayload) => {
    if (editingTransaction && onUpdate) {
      onUpdate({ ...editingTransaction, ...payload });
      onCancelEdit?.();
      return;
    }

    onSubmit(payload);
    setBankForm({ ...emptyBankForm, date: new Date().toISOString().slice(0, 10) });
  };

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

    applyCashPayload({
      date: cashForm.date,
      desc: description,
      clientName: isPayment ? clientName : undefined,
      spentBy: isPayment ? undefined : cashForm.spentBy.trim() || undefined,
      cat: isPayment ? 'Client Payment' : cashForm.cat,
      type: isPayment ? 'income' : 'expense',
      amount,
    });
  };

  const handleBankSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(bankForm.amount);
    if (!bankForm.desc.trim() || !bankForm.date || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    applyBankPayload({
      date: bankForm.date,
      desc: bankForm.desc.trim(),
      cat: bankForm.cat,
      type: bankForm.type,
      amount,
    });
  };

  if (activeSource === 'cash') {
    const isPayment = cashForm.entryKind === 'payment';

    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit cash entry' : 'Add Cash Transaction'}</CardTitle>
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
                        ? (clientNames[0] ?? '')
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
                {clientNames.length > 0 ? (
                  <CreatableSelect
                    id="cash-client"
                    value={cashForm.clientName || clientNames[0]}
                    onValueChange={(value) =>
                      setCashForm((current) => ({ ...current, clientName: value }))
                    }
                    options={clientNames}
                    onAddOption={(label) => addClient(label)}
                    placeholder="Select client"
                    addLabel="Add new client"
                  />
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
                <CreatableSelect
                  id="cash-cat"
                  value={cashForm.cat}
                  onValueChange={(value) =>
                    setCashForm((current) => ({ ...current, cat: value }))
                  }
                  options={expenseCategories}
                  onAddOption={(label) => addOption('expenseCategories', label)}
                  addLabel="Add new category"
                />
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

            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" className="w-full sm:w-auto">
                {isEditing ? 'Save changes' : 'Add Transaction'}
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit bank entry' : 'Add Bank Transaction'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBankSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor={`${activeSource}-date`}>Date</Label>
            <Input
              id={`${activeSource}-date`}
              type="date"
              value={bankForm.date}
              onChange={(event) =>
                setBankForm((current) => ({ ...current, date: event.target.value }))
              }
              required
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <Label htmlFor={`${activeSource}-desc`}>Description</Label>
            <Input
              id={`${activeSource}-desc`}
              value={bankForm.desc}
              onChange={(event) =>
                setBankForm((current) => ({ ...current, desc: event.target.value }))
              }
              placeholder="What was this for?"
              required
            />
          </div>

          <div>
            <Label htmlFor={`${activeSource}-cat`}>Category</Label>
            <CreatableSelect
              id={`${activeSource}-cat`}
              value={bankForm.cat}
              onValueChange={(value) => setBankForm((current) => ({ ...current, cat: value }))}
              options={bankCategories}
              onAddOption={(label) => addOption('bankCategories', label)}
              addLabel="Add new category"
            />
          </div>

          <div>
            <Label htmlFor={`${activeSource}-type`}>Type</Label>
            <Select
              value={bankForm.type}
              onValueChange={(value) =>
                setBankForm((current) => ({ ...current, type: value as TransactionType }))
              }
            >
              <SelectTrigger id={`${activeSource}-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`${activeSource}-amount`}>Amount (₹)</Label>
            <Input
              id={`${activeSource}-amount`}
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

          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="submit" className="w-full sm:w-auto">
              {isEditing ? 'Save changes' : 'Add Transaction'}
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
