export type DashboardView = 'financial' | 'projects' | 'clients' | 'procurement';

export type DashboardViewOption = {
  id: DashboardView;
  label: string;
  description: string;
};

export const DASHBOARD_VIEWS: DashboardViewOption[] = [
  {
    id: 'financial',
    label: 'Bank & Cash',
    description: 'Income, expenses, and bank vs cash split',
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Project costs, payroll, and client receipts',
  },
  {
    id: 'clients',
    label: 'Clients',
    description: 'Payments by project and client',
  },
  {
    id: 'procurement',
    label: 'Procurement',
    description: 'Orders, suppliers, and payment status',
  },
];

export function getDashboardViewLabel(view: DashboardView): string {
  return DASHBOARD_VIEWS.find((option) => option.id === view)?.label ?? 'Dashboard';
}
