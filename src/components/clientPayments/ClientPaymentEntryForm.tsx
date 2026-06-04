import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  applyClientPaymentUpdate,
  getClientProjectList,
  getProjectsForClient,
  normalizeSheetProjectLabel,
} from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClientPaymentRecord } from '@/types/clientPayment';

type ClientPaymentEntryFormProps = {
  sheetProject?: string;
  clientName?: string;
  showSplitAmounts: boolean;
  editingRecord?: ClientPaymentRecord | null;
  onCancelEdit?: () => void;
};

/**
 * Form to add a client payment line for a project or client view.
 */
export function ClientPaymentEntryForm({
  sheetProject,
  clientName,
  showSplitAmounts,
  editingRecord = null,
  onCancelEdit,
}: ClientPaymentEntryFormProps) {
  const { records, registry, addPayment, updatePayment, addProject } = useClientPayments();
  const isEditing = editingRecord !== null;
  const projectOptions = useMemo(() => {
    if (clientName) {
      const forClient = getProjectsForClient(records, registry, clientName);
      return forClient.length > 0 ? forClient : getClientProjectList(records, registry);
    }
    return getClientProjectList(records, registry);
  }, [records, registry, clientName]);

  const projectLabels = useMemo(
    () => projectOptions.map((project) => project.sheetProject),
    [projectOptions],
  );

  const defaultProject =
    sheetProject ??
    projectOptions[0]?.sheetProject ??
    normalizeSheetProjectLabel('P-01');

  const [selectedProject, setSelectedProject] = useState(defaultProject);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [banking, setBanking] = useState('');
  const [cash, setCash] = useState('');
  const [gpay, setGpay] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const lockedProject = Boolean(sheetProject);
  const activeProject = lockedProject ? sheetProject! : selectedProject;

  useEffect(() => {
    if (sheetProject) {
      setSelectedProject(sheetProject);
    }
  }, [sheetProject]);

  useEffect(() => {
    if (!editingRecord) {
      return;
    }

    setSelectedProject(editingRecord.sheetProject);
    setPaymentDate(editingRecord.paymentDate);
    setDescription(editingRecord.description === '—' ? '' : editingRecord.description);
    setInvoiceNumber(editingRecord.invoiceNumber);
    if (showSplitAmounts) {
      setBanking(editingRecord.banking > 0 ? String(editingRecord.banking) : '');
      setCash(editingRecord.cash > 0 ? String(editingRecord.cash) : '');
      setGpay(editingRecord.gpay > 0 ? String(editingRecord.gpay) : '');
      setAmount('');
    } else {
      setAmount(editingRecord.amount > 0 ? String(editingRecord.amount) : '');
      setBanking('');
      setCash('');
      setGpay('');
    }
  }, [editingRecord, showSplitAmounts]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedBanking = Number(showSplitAmounts ? banking : amount);
    const parsedCash = Number(showSplitAmounts ? cash : 0);
    const parsedGpay = Number(showSplitAmounts ? gpay : 0);

    if (!activeProject || !paymentDate || !description.trim()) {
      return;
    }

    if (
      !Number.isFinite(parsedBanking) ||
      !Number.isFinite(parsedCash) ||
      !Number.isFinite(parsedGpay) ||
      parsedBanking < 0 ||
      parsedCash < 0 ||
      parsedGpay < 0
    ) {
      return;
    }

    const totalAmount = showSplitAmounts
      ? parsedBanking + parsedCash + parsedGpay
      : parsedBanking;

    if (totalAmount <= 0) {
      window.alert('Enter an amount greater than zero.');
      return;
    }

    const input = {
      sheetProject: activeProject,
      paymentDate,
      description: description.trim(),
      banking: parsedBanking,
      cash: parsedCash,
      gpay: parsedGpay,
      invoiceNumber,
    };

    if (isEditing && editingRecord) {
      const updated = applyClientPaymentUpdate(editingRecord, input, showSplitAmounts);
      if (!updated) {
        window.alert('Could not save payment. Check the fields and try again.');
        return;
      }
      updatePayment(updated);
      onCancelEdit?.();
      return;
    }

    const saved = addPayment(input, showSplitAmounts);

    if (!saved) {
      window.alert('Could not add payment. Check that the project exists.');
      return;
    }

    setDescription('');
    setBanking('');
    setCash('');
    setGpay('');
    setAmount('');
    setInvoiceNumber('');
  };

  if (projectOptions.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {isEditing ? 'Edit payment' : 'Add payment received'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className={`grid gap-4 ${showSplitAmounts ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-5'}`}
        >
          {!lockedProject && (
            <div className="space-y-2">
              <Label htmlFor="payment-project">Project</Label>
              <CreatableSelect
                id="payment-project"
                value={selectedProject}
                onValueChange={setSelectedProject}
                options={projectLabels}
                onAddOption={(label) => {
                  const sheetProject = normalizeSheetProjectLabel(label);
                  return addProject({
                    sheetProject,
                    projectCode: sheetProject,
                    projectName: sheetProject,
                    clientName: clientName ?? 'New client',
                  });
                }}
                placeholder="Select project"
                addLabel="Add new project"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment-date">Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              required
            />
          </div>

          <div className={`space-y-2 ${lockedProject ? 'sm:col-span-2' : 'lg:col-span-2'}`}>
            <Label htmlFor="payment-description">Description</Label>
            <Input
              id="payment-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Payment description"
              required
            />
          </div>

          {showSplitAmounts ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="payment-banking">Banking (₹)</Label>
                <Input
                  id="payment-banking"
                  type="number"
                  min="0"
                  step="0.01"
                  value={banking}
                  onChange={(event) => setBanking(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-cash">Cash (₹)</Label>
                <Input
                  id="payment-cash"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cash}
                  onChange={(event) => setCash(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-gpay">GPay (₹)</Label>
                <Input
                  id="payment-gpay"
                  type="number"
                  min="0"
                  step="0.01"
                  value={gpay}
                  onChange={(event) => setGpay(event.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount (₹)</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment-invoice">Invoice (optional)</Label>
            <Input
              id="payment-invoice"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <Button type="submit" className="w-full sm:w-auto">
              {isEditing ? 'Save changes' : 'Add payment'}
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
