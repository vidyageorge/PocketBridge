import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { parseClientPaymentWorkbook } from '@/lib/clientPayment';
import {
  loadClientPaymentRecords,
  saveClientPaymentRecords,
} from '@/lib/clientPaymentStorage';
import type { ClientPaymentRecord } from '@/types/clientPayment';

type ClientPaymentContextValue = {
  records: ClientPaymentRecord[];
  replaceFromFile: (file: File) => Promise<number>;
};

const ClientPaymentContext = createContext<ClientPaymentContextValue | null>(null);

export function ClientPaymentProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ClientPaymentRecord[]>(() => loadClientPaymentRecords());

  const replaceFromFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseClientPaymentWorkbook(buffer);
    setRecords(parsed);
    saveClientPaymentRecords(parsed);
    return parsed.length;
  }, []);

  const value = useMemo(
    () => ({
      records,
      replaceFromFile,
    }),
    [records, replaceFromFile],
  );

  return (
    <ClientPaymentContext.Provider value={value}>{children}</ClientPaymentContext.Provider>
  );
}

export function useClientPayments(): ClientPaymentContextValue {
  const context = useContext(ClientPaymentContext);
  if (!context) {
    throw new Error('useClientPayments must be used within ClientPaymentProvider');
  }
  return context;
}
