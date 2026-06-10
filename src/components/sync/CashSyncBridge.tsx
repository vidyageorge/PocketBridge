import { useEffect } from 'react';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { useTransactions } from '@/context/TransactionContext';

/**
 * Keeps the cash ledger in sync with project payment records.
 */
export function CashSyncBridge() {
  const { records } = useClientPayments();
  const { syncCashFromClientPayments } = useTransactions();

  useEffect(() => {
    syncCashFromClientPayments(records);
  }, [records, syncCashFromClientPayments]);

  return null;
}
