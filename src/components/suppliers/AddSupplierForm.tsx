import { useState, type FormEvent } from 'react';
import { useProcurement } from '@/context/ProcurementContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AddSupplierFormProps = {
  onSupplierAdded?: (supplierName: string) => void;
};

/**
 * Form to register a new supplier for the Suppliers page.
 */
export function AddSupplierForm({ onSupplierAdded }: AddSupplierFormProps) {
  const { addSupplier } = useProcurement();
  const [supplierName, setSupplierName] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errorMessage = addSupplier(supplierName);
    if (errorMessage) {
      window.alert(errorMessage);
      return;
    }

    const trimmedName = supplierName.trim();
    setSupplierName('');
    onSupplierAdded?.(trimmedName);
  };

  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add supplier</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="new-supplier-name">Supplier name</Label>
            <Input
              id="new-supplier-name"
              value={supplierName}
              onChange={(event) => setSupplierName(event.target.value)}
              placeholder="e.g. T.K.G TRADERS"
              required
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Add supplier
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
