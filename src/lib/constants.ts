import { STORE_KEYS } from '@/lib/storeKeys';

export const STORAGE_KEY = STORE_KEYS.TRANSACTIONS;

export const COMPANY_NAME = 'Sixty Cubits Pvt Ltd';
export const COMPANY_LOCATION = 'Chennai, Tamil Nadu';
export const APP_NAME = 'PocketBridge';
export const APP_TAGLINE = 'One stop for Bank | Cash | Procurement | Client payments';

export const BRAND_COLORS = {
  /** Charts only — UI buttons use navNavy */
  chartTeal: '#0f6e56',
  chartGold: '#ba7517',
  navNavy: '#1a3b5d',
  navYellow: '#f5a623',
} as const;

export const BRAND_LOGO_PATH = '/sixty-cubits-logo.png';

export const INCOME_CATEGORIES = ['Client Payment', 'Salary', 'Other Income'] as const;

export const EXPENSE_CATEGORIES = [
  'Materials',
  'Labour',
  'Equipment',
  'Transport',
  'Utilities',
  'Food',
  'Shopping',
  'Health',
  'Other',
] as const;

export const CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const;

export const PROCUREMENT_PAYMENT_STATUSES = ['Completed', 'Pending', 'Partial'] as const;

/** Matches workbook description labels for employee expense lines. */
export const EMPLOYEE_EXPENSE_CATEGORIES = [
  'Material Expanse',
  'labor Contract Payment - Civil',
  'labor Contract Payment - Electrical',
  'Salary',
  'bonus-insentive',
  'Fuel',
  'Food',
  'Electricity',
  'Telephone / Internet',
  'Rent & Maintenace',
  'Marketing',
  "Personal Advance's",
  'CAR EMI',
  'Maintenance-jawa',
  'Car Insuranace',
  'Others',
] as const;

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

/** Demo bank/cash lines removed — use ICICI import and the cash ledger form instead. */
export const SEED_TRANSACTIONS = [] as const;
