/** Keys shared by browser localStorage and the SQLite API store. */
export const STORE_KEYS = {
  TRANSACTIONS: 'pocketbridge_txs',
  ACCOUNT_BALANCES: 'pocketbridge_account_balances',
  CLIENT_PAYMENTS: 'pocketbridge_client_payments',
  CLIENT_PAYMENT_REGISTRY: 'pocketbridge_client_payment_registry',
  CLIENT_PAYMENT_SEED_VERSION: 'pocketbridge_client_payments_seed_version',
  PROCUREMENT: 'pocketbridge_procurement',
  SUPPLIER_REGISTRY: 'pocketbridge_supplier_registry',
  EXPENSES: 'pocketbridge_expenses',
} as const;

export type StoreKey = (typeof STORE_KEYS)[keyof typeof STORE_KEYS];
