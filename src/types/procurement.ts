export type ProcurementRecord = {
  id: number;
  sheetMonth: number;
  sheetYear: number;
  sno: string;
  orderDate: string;
  description: string;
  supplier: string;
  billDate: string;
  deliveryDate: string;
  project: string;
  invoiceNumber: string;
  amount: number;
  orderedBy: string;
  paymentStatus: string;
  paymentDate: string;
  paymentMode: string;
};

export type ProcurementRecordInput = Omit<ProcurementRecord, 'id'>;

export type ProcurementMonthFilter = number | 'all';
export type ProcurementYearFilter = number | 'all';

export type ProcurementColumnFilters = {
  sno: string;
  orderDate: string;
  description: string;
  supplier: string;
  billDate: string;
  deliveryDate: string;
  project: string;
  invoiceNumber: string;
  amount: string;
  orderedBy: string;
  paymentStatus: string;
  paymentDate: string;
};

export const EMPTY_PROCUREMENT_FILTERS: ProcurementColumnFilters = {
  sno: '',
  orderDate: '',
  description: '',
  supplier: '',
  billDate: '',
  deliveryDate: '',
  project: '',
  invoiceNumber: '',
  amount: '',
  orderedBy: '',
  paymentStatus: '',
  paymentDate: '',
};

export type ProcurementSummary = {
  orderCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  completedCount: number;
  pendingCount: number;
};
