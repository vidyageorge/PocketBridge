import { getClientProjectList } from '@/lib/clientPayment';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClientPaymentRecord } from '@/types/clientPayment';

type ClientPaymentProjectFilterProps = {
  sheetProject: string;
  records: ClientPaymentRecord[];
  onProjectChange: (sheetProject: string) => void;
};

export function ClientPaymentProjectFilter({
  sheetProject,
  records,
  onProjectChange,
}: ClientPaymentProjectFilterProps) {
  const projects = getClientProjectList(records);

  return (
    <div className="w-full sm:w-56">
      <Label htmlFor="client-payment-project">Project</Label>
      <Select value={sheetProject} onValueChange={onProjectChange}>
        <SelectTrigger id="client-payment-project">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.sheetProject} value={project.sheetProject}>
              {project.sheetProject}
              {project.clientName ? ` — ${project.clientName}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
