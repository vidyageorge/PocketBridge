export type ClientPaymentRecord = {
  id: number;
  sheetProject: string;
  projectCode: string;
  projectName: string;
  clientName: string;
  sno: string;
  paymentDate: string;
  description: string;
  banking: number;
  cash: number;
  gpay: number;
  amount: number;
  invoiceNumber: string;
  remarkDate: string;
  remarkValue: number;
  comment: string;
};

export type ClientPaymentColumnFilters = {
  sno: string;
  paymentDate: string;
  description: string;
  banking: string;
  cash: string;
  gpay: string;
  amount: string;
  invoiceNumber: string;
  comment: string;
};

export const EMPTY_CLIENT_PAYMENT_FILTERS: ClientPaymentColumnFilters = {
  sno: '',
  paymentDate: '',
  description: '',
  banking: '',
  cash: '',
  gpay: '',
  amount: '',
  invoiceNumber: '',
  comment: '',
};

export type ClientPaymentSummary = {
  paymentCount: number;
  totalAmount: number;
  totalBanking: number;
  totalCash: number;
  totalGpay: number;
};

export type ClientProjectMeta = {
  sheetProject: string;
  projectCode: string;
  projectName: string;
  clientName: string;
};

export type ClientPaymentRegistry = {
  projects: ClientProjectMeta[];
  clientNames: string[];
};

export const EMPTY_CLIENT_PAYMENT_REGISTRY: ClientPaymentRegistry = {
  projects: [],
  clientNames: [],
};

export type AddClientProjectInput = {
  sheetProject: string;
  projectCode: string;
  projectName: string;
  clientName: string;
};

export type ClientPaymentInput = {
  sheetProject: string;
  paymentDate: string;
  description: string;
  banking: number;
  cash: number;
  gpay: number;
  invoiceNumber?: string;
  comment?: string;
};
