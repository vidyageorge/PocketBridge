import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DASHBOARD_VIEWS, type DashboardView } from '@/lib/dashboardViews';
import { cn } from '@/lib/utils';

const DASHBOARD_MENU_ITEM_CLASS =
  'inline-flex w-full items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all bg-nav-yellow text-nav-yellow-foreground hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-navy';

type DashboardMenuTriggerProps = {
  isActive: boolean;
  activeView: DashboardView;
  onOpenDashboard: () => void;
  onViewSelect: (view: DashboardView) => void;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

/**
 * Main nav control for Dashboard: opens a menu of dashboard boards on click.
 */
export function DashboardMenuTrigger({
  isActive,
  activeView,
  onOpenDashboard,
  onViewSelect,
}: DashboardMenuTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updateMenuPosition = () => {
    if (!triggerRef.current) {
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width });
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
      if ((event.target as Element).closest('[data-dashboard-menu]')) {
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
    onOpenDashboard();
    setIsOpen((current) => !current);
  };

  const handleViewSelect = (view: DashboardView) => {
    onViewSelect(view);
    setIsOpen(false);
  };

  const menu =
    isOpen && menuPosition
      ? createPortal(
          <div
            data-dashboard-menu
            role="menu"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.width,
            }}
            className="fixed z-[200] flex flex-col gap-1 rounded-xl border border-border bg-white/90 p-1.5 shadow-lg backdrop-blur-sm"
          >
            {DASHBOARD_VIEWS.map((option) => {
              const isSelected = isActive && activeView === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitem"
                  className={cn(
                    DASHBOARD_MENU_ITEM_CLASS,
                    isSelected &&
                      'bg-nav-navy text-nav-navy-foreground shadow-sm hover:brightness-100',
                  )}
                  onClick={() => handleViewSelect(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
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
          DASHBOARD_MENU_ITEM_CLASS,
          'w-auto',
          isActive && 'bg-nav-navy text-nav-navy-foreground shadow-sm hover:brightness-100',
        )}
        onClick={handleTriggerClick}
      >
        Dashboard
      </button>
      {menu}
    </>
  );
}
