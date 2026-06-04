import { useState, type FormEvent } from 'react';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AddClientFormProps = {
  onClientAdded?: (clientName: string) => void;
};

/**
 * Form to register a new client for the Clients sub-view.
 */
export function AddClientForm({ onClientAdded }: AddClientFormProps) {
  const { addClient } = useClientPayments();
  const [clientName, setClientName] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errorMessage = addClient(clientName);
    if (errorMessage) {
      window.alert(errorMessage);
      return;
    }

    const trimmedName = clientName.trim();
    setClientName('');
    onClientAdded?.(trimmedName);
  };

  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add client</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="new-client-name">Client name</Label>
            <Input
              id="new-client-name"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="e.g. MR.NAME"
              required
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Add client
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
