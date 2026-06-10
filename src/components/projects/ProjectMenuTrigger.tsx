import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getActiveClientProjectList } from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { cn } from '@/lib/utils';

const PROJECT_MENU_ITEM_CLASS =
  'inline-flex w-full items-center justify-start whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all bg-nav-yellow text-nav-yellow-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-navy';

type ProjectMenuTriggerProps = {
  isActive: boolean;
  selectedProject: string;
  onOpenProjects: () => void;
  onProjectSelect: (sheetProject: string) => void;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

function formatProjectLabel(project: {
  sheetProject: string;
  projectName: string;
  clientName: string;
}): string {
  if (project.clientName) {
    return `${project.sheetProject} — ${project.clientName}`;
  }
  if (project.projectName) {
    return `${project.sheetProject} — ${project.projectName}`;
  }
  return project.sheetProject;
}

export function ProjectMenuTrigger({
  isActive,
  selectedProject,
  onOpenProjects,
  onProjectSelect,
}: ProjectMenuTriggerProps) {
  const { records, registry } = useClientPayments();
  const projects = getActiveClientProjectList(records, registry);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updateMenuPosition = () => {
    if (!triggerRef.current) {
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 220) });
  };

  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) {
        return;
      }
      if ((event.target as Element).closest('[data-project-menu]')) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleLayoutChange = () => updateMenuPosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    onOpenProjects();
    setIsOpen((current) => !current);
  };

  const handleProjectSelect = (sheetProject: string) => {
    onProjectSelect(sheetProject);
    setIsOpen(false);
  };

  const menu =
    isOpen && menuPosition
      ? createPortal(
          <div
            data-project-menu
            role="menu"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.width,
            }}
            className="fixed z-[200] flex max-h-80 flex-col gap-1 overflow-y-auto rounded-xl border border-border bg-white/90 p-1.5 shadow-lg backdrop-blur-sm"
          >
            {projects.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No active projects</p>
            ) : (
              projects.map((project) => {
                const isSelected = isActive && selectedProject === project.sheetProject;
                return (
                  <button
                    key={project.sheetProject}
                    type="button"
                    role="menuitem"
                    className={cn(
                      PROJECT_MENU_ITEM_CLASS,
                      isSelected &&
                        'bg-nav-navy text-nav-navy-foreground shadow-sm hover:brightness-100',
                    )}
                    onClick={() => handleProjectSelect(project.sheetProject)}
                  >
                    {formatProjectLabel(project)}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          PROJECT_MENU_ITEM_CLASS,
          'w-auto justify-center',
          isActive && 'bg-nav-navy text-nav-navy-foreground shadow-sm hover:brightness-100',
        )}
        onClick={handleTriggerClick}
      >
        Project
      </button>
      {menu}
    </>
  );
}
