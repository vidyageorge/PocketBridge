import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getSupplierList } from '@/lib/procurement';
import { useCustomOptions } from '@/context/CustomOptionsContext';
import { useProcurement } from '@/context/ProcurementContext';
import { Button } from '@/components/ui/button';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProcurementRecord, ProcurementRecordInput } from '@/types/procurement';

type ProcurementFormProps = {
  sheetMonth: number;
  sheetYear: number;
  editingRecord: ProcurementRecord | null;
  onAdd: (record: ProcurementRecordInput) => void;
  onUpdate: (record: ProcurementRecord) => void;
  onCancelEdit: () => void;
};

function defaultOrderDate(month: number, year: number): string {
  const now = new Date();
  if (now.getMonth() + 1 === month && now.getFullYear() === year) {
    return now.toISOString().slice(0, 10);
  }
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function createEmptyInput(month: number, year: number): ProcurementRecordInput {
  return {
    sheetMonth: month,
    sheetYear: year,
    sno: '',
    orderDate: defaultOrderDate(month, year),
    description: '',
    supplier: '',
    billDate: '',
    deliveryDate: '',
    project: '',
    invoiceNumber: '',
    amount: 0,
    orderedBy: '',
    paymentStatus: 'Pending',
    paymentDate: '',
    paymentMode: '',
  };
}

function recordToFormInput(record: ProcurementRecord): ProcurementRecordInput {
  const { id: _id, ...input } = record;
  return input;
}

export function ProcurementForm({
  sheetMonth,
  sheetYear,
  editingRecord,
  onAdd,
  onUpdate,
  onCancelEdit,
}: ProcurementFormProps) {
  const { records, supplierRegistry, addSupplier } = useProcurement();
  const { getOptions, addOption } = useCustomOptions();
  const paymentStatuses = getOptions('procurementPaymentStatuses');
  const paymentModes = getOptions('paymentModes');
  const supplierNames = useMemo(
    () => getSupplierList(records, supplierRegistry).map((entry) => entry.supplierName),
    [records, supplierRegistry],
  );

  const isEditing = editingRecord !== null;
  const [form, setForm] = useState<ProcurementRecordInput>(() =>
    createEmptyInput(sheetMonth, sheetYear),
  );

  useEffect(() => {
    if (editingRecord) {
      setForm(recordToFormInput(editingRecord));
      return;
    }
    setForm(createEmptyInput(sheetMonth, sheetYear));
  }, [editingRecord, sheetMonth, sheetYear]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(form.amount);
    if (!form.description.trim() || !form.orderDate || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const payload: ProcurementRecordInput = {
      ...form,
      sheetMonth: isEditing && editingRecord ? editingRecord.sheetMonth : sheetMonth,
      sheetYear: isEditing && editingRecord ? editingRecord.sheetYear : sheetYear,
      description: form.description.trim(),
      supplier: form.supplier.trim() || '—',
      project: form.project.trim() || '—',
      sno: form.sno.trim(),
      orderedBy: form.orderedBy.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      paymentMode: form.paymentMode.trim(),
      amount,
    };

    if (isEditing && editingRecord) {
      onUpdate({ ...payload, id: editingRecord.id });
      onCancelEdit();
      return;
    }

    onAdd(payload);
    setForm(createEmptyInput(sheetMonth, sheetYear));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit procurement order' : 'Add procurement order'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="procurement-sno">S.No</Label>
            <Input
              id="procurement-sno"
              value={form.sno}
              onChange={(event) => setForm((current) => ({ ...current, sno: event.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="procurement-order-date">Order Date</Label>
            <Input
              id="procurement-order-date"
              type="date"
              value={form.orderDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, orderDate: event.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="procurement-project">Project</Label>
            <Input
              id="procurement-project"
              value={form.project}
              onChange={(event) =>
                setForm((current) => ({ ...current, project: event.target.value }))
              }
              placeholder="P-01"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="procurement-description">Description</Label>
            <Input
              id="procurement-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Material or service ordered"
              required
            />
          </div>

          <div>
            <Label htmlFor="procurement-supplier">Supplier</Label>
            <CreatableSelect
              id="procurement-supplier"
              value={form.supplier || supplierNames[0] || ''}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, supplier: value }))
              }
              options={supplierNames.length > 0 ? supplierNames : ['—']}
              onAddOption={(label) => addSupplier(label)}
              placeholder="Select supplier"
              addLabel="Add new supplier"
            />
          </div>

          <div>
            <Label htmlFor="procurement-ordered-by">Ordered By</Label>
            <Input
              id="procurement-ordered-by"
              value={form.orderedBy}
              onChange={(event) =>
                setForm((current) => ({ ...current, orderedBy: event.target.value }))
              }
              placeholder="Person name"
            />
          </div>

          <div>
            <Label htmlFor="procurement-amount">Amount (₹)</Label>
            <Input
              id="procurement-amount"
              type="number"
              min="1"
              step="1"
              value={form.amount || ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: Number(event.target.value) }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="procurement-bill-date">Bill Date</Label>
            <Input
              id="procurement-bill-date"
              type="date"
              value={form.billDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, billDate: event.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="procurement-delivery-date">Delivery Date</Label>
            <Input
              id="procurement-delivery-date"
              type="date"
              value={form.deliveryDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, deliveryDate: event.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="procurement-invoice">Invoice No.</Label>
            <Input
              id="procurement-invoice"
              value={form.invoiceNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, invoiceNumber: event.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="procurement-payment-status">Payment Status</Label>
            <CreatableSelect
              id="procurement-payment-status"
              value={form.paymentStatus}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, paymentStatus: value }))
              }
              options={paymentStatuses}
              onAddOption={(label) => addOption('procurementPaymentStatuses', label)}
              addLabel="Add new status"
            />
          </div>

          <div>
            <Label htmlFor="procurement-payment-date">Payment Date</Label>
            <Input
              id="procurement-payment-date"
              type="date"
              value={form.paymentDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, paymentDate: event.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="procurement-payment-mode">Payment Mode</Label>
            <CreatableSelect
              id="procurement-payment-mode"
              value={form.paymentMode || paymentModes[0] || ''}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, paymentMode: value }))
              }
              options={paymentModes}
              onAddOption={(label) => addOption('paymentModes', label)}
              placeholder="Select mode"
              addLabel="Add new mode"
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="submit">{isEditing ? 'Save changes' : 'Add order'}</Button>
            {isEditing && (
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
