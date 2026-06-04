import { useState, type FormEvent } from 'react';
import { getNextSheetProjectLabel } from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AddProjectFormProps = {
  onProjectAdded?: (sheetProject: string) => void;
};

/**
 * Form to register a new project with code, name, and client.
 */
export function AddProjectForm({ onProjectAdded }: AddProjectFormProps) {
  const { addProject, records, registry } = useClientPayments();
  const [projectCode, setProjectCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const sheetProject = getNextSheetProjectLabel(records, registry);
    const errorMessage = addProject({
      sheetProject,
      projectCode,
      projectName,
      clientName,
    });

    if (errorMessage) {
      window.alert(errorMessage);
      return;
    }

    setProjectCode('');
    setProjectName('');
    setClientName('');
    onProjectAdded?.(sheetProject);
  };

  return (
    <Card className="border-border/80 bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="new-project-code">Project code</Label>
            <Input
              id="new-project-code"
              value={projectCode}
              onChange={(event) => setProjectCode(event.target.value)}
              placeholder="e.g. P05/26-01"
              required
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="new-project-name">Project name</Label>
            <Input
              id="new-project-name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Construction of …"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-project-client">Client</Label>
            <Input
              id="new-project-client"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="e.g. MR.NAME"
              required
            />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button type="submit" className="w-full sm:w-auto">
              Add project
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
