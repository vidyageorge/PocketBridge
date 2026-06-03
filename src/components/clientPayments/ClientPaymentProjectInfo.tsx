import { Card, CardContent } from '@/components/ui/card';
import type { ClientProjectMeta } from '@/types/clientPayment';

type ClientPaymentProjectInfoProps = {
  project: ClientProjectMeta | null;
};

export function ClientPaymentProjectInfo({ project }: ClientPaymentProjectInfoProps) {
  if (!project) {
    return null;
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Project code
          </p>
          <p className="text-sm font-medium">{project.projectCode}</p>
        </div>
        {project.projectName && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project name
            </p>
            <p className="text-sm">{project.projectName}</p>
          </div>
        )}
        {project.clientName && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Client
            </p>
            <p className="text-sm font-medium">{project.clientName}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
