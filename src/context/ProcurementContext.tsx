import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { parseProcurementWorkbook } from '@/lib/procurement';
import {
  getNextProcurementId,
  loadProcurementRecords,
  saveProcurementRecords,
} from '@/lib/procurementStorage';
import {
  loadSupplierRegistry,
  saveSupplierRegistry,
} from '@/lib/supplierRegistryStorage';
import type {
  ProcurementRecord,
  ProcurementRecordInput,
  SupplierRegistry,
} from '@/types/procurement';

type ProcurementContextValue = {
  records: ProcurementRecord[];
  supplierRegistry: SupplierRegistry;
  addRecord: (record: ProcurementRecordInput) => void;
  updateRecord: (record: ProcurementRecord) => void;
  deleteRecord: (id: number) => void;
  addSupplier: (supplierName: string) => string | null;
  replaceFromFile: (file: File) => Promise<number>;
};

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

function persistRecords(records: ProcurementRecord[]): ProcurementRecord[] {
  saveProcurementRecords(records);
  return records;
}

function persistSupplierRegistry(registry: SupplierRegistry): SupplierRegistry {
  saveSupplierRegistry(registry);
  return registry;
}

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ProcurementRecord[]>(() => loadProcurementRecords());
  const [supplierRegistry, setSupplierRegistry] = useState<SupplierRegistry>(() =>
    loadSupplierRegistry(),
  );

  const addRecord = useCallback((record: ProcurementRecordInput) => {
    setRecords((current) => {
      const nextRecord: ProcurementRecord = {
        ...record,
        id: getNextProcurementId(current),
      };
      return persistRecords([...current, nextRecord]);
    });
  }, []);

  const updateRecord = useCallback((record: ProcurementRecord) => {
    setRecords((current) => {
      const nextRecords = current.map((existing) =>
        existing.id === record.id ? record : existing,
      );
      return persistRecords(nextRecords);
    });
  }, []);

  const deleteRecord = useCallback((id: number) => {
    setRecords((current) => persistRecords(current.filter((record) => record.id !== id)));
  }, []);

  const addSupplier = useCallback(
    (supplierName: string): string | null => {
      const trimmedName = supplierName.trim();
      if (!trimmedName) {
        return 'Enter a supplier name.';
      }

      const existsInOrders = records.some(
        (record) => record.supplier.trim() === trimmedName,
      );
      const existsInRegistry = supplierRegistry.supplierNames.includes(trimmedName);

      if (existsInOrders || existsInRegistry) {
        return `Supplier ${trimmedName} is already listed.`;
      }

      setSupplierRegistry((current) =>
        persistSupplierRegistry({
          supplierNames: [...current.supplierNames, trimmedName].sort((left, right) =>
            left.localeCompare(right),
          ),
        }),
      );

      return null;
    },
    [records, supplierRegistry],
  );

  const replaceFromFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseProcurementWorkbook(buffer);
    setRecords(parsed);
    saveProcurementRecords(parsed);
    return parsed.length;
  }, []);

  const value = useMemo(
    () => ({
      records,
      supplierRegistry,
      addRecord,
      updateRecord,
      deleteRecord,
      addSupplier,
      replaceFromFile,
    }),
    [
      records,
      supplierRegistry,
      addRecord,
      updateRecord,
      deleteRecord,
      addSupplier,
      replaceFromFile,
    ],
  );

  return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>;
}

export function useProcurement(): ProcurementContextValue {
  const context = useContext(ProcurementContext);
  if (!context) {
    throw new Error('useProcurement must be used within ProcurementProvider');
  }
  return context;
}
