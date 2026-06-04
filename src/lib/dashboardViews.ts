export type DashboardView =
  | 'financial'
  | 'projects'
  | 'clients'
  | 'procurement'
  | 'suppliers';

export type DashboardViewOption = {
  id: DashboardView;
  label: string;
};

export const DASHBOARD_VIEWS: DashboardViewOption[] = [
  { id: 'financial', label: 'Bank + Cash' },
  { id: 'projects', label: 'Projects & team' },
  { id: 'clients', label: 'Clients' },
  { id: 'procurement', label: 'Spending' },
  { id: 'suppliers', label: 'Suppliers' },
];

export function getDashboardViewLabel(view: DashboardView): string {
  return DASHBOARD_VIEWS.find((option) => option.id === view)?.label ?? 'Dashboard';
}
