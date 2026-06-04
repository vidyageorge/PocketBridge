import { getClientProjectList } from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { cn } from '@/lib/utils';

type ClientPaymentProjectButtonsProps = {
  sheetProject: string;
  onProjectChange: (sheetProject: string) => void;
};

/**
 * Project sheet picker (P-01, P-02, …) matching the Excel workbook tabs.
 */
export function ClientPaymentProjectButtons({
  sheetProject,
  onProjectChange,
}: ClientPaymentProjectButtonsProps) {
  const { records, registry } = useClientPayments();
  const projects = getClientProjectList(records, registry);

  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a project below or upload the client payments workbook.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {projects.map((project) => {
        const isActive = sheetProject === project.sheetProject;
        return (
          <button
            key={project.sheetProject}
            type="button"
            onClick={() => onProjectChange(project.sheetProject)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
              'bg-nav-yellow text-nav-yellow-foreground hover:brightness-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-navy',
              isActive && 'bg-nav-navy text-nav-navy-foreground shadow-sm hover:brightness-100',
            )}
          >
            {project.sheetProject}
          </button>
        );
      })}
    </div>
  );
}
