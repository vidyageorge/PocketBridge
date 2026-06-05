import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { buildFieldChanges, captureStoreSnapshot } from '@/lib/activityLog';
import { recordActivity } from '@/lib/activityLogRecorder';
import { parseProcurementWorkbook } from '@/lib/procurement';
import { STORE_KEYS } from '@/lib/storeKeys';
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
    const undoPayload = captureStoreSnapshot([STORE_KEYS.PROCUREMENT]);

    setRecords((current) => {
      const nextRecord: ProcurementRecord = {
        ...record,
        id: getNextProcurementId(current),
      };
      return persistRecords([...current, nextRecord]);
    });

    recordActivity({
      action: 'create',
      entityType: 'procurement',
      title: `Added procurement order: ${record.description}`,
      detail: record.supplier,
      undoPayload,
    });
  }, []);

  const updateRecord = useCallback((record: ProcurementRecord) => {
    const before = records.find((existing) => existing.id === record.id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.PROCUREMENT]);

    setRecords((current) => {
      const nextRecords = current.map((existing) =>
        existing.id === record.id ? record : existing,
      );
      return persistRecords(nextRecords);
    });

    if (before) {
      recordActivity({
        action: 'update',
        entityType: 'procurement',
        title: `Updated procurement order: ${record.description}`,
        detail: record.supplier,
        changes: buildFieldChanges(
          before as unknown as Record<string, unknown>,
          record as unknown as Record<string, unknown>,
          [
            { key: 'description', label: 'Description' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'amount', label: 'Amount' },
            { key: 'paymentStatus', label: 'Payment status' },
          ],
        ),
        undoPayload,
      });
    }
  }, [records]);

  const deleteRecord = useCallback((id: number) => {
    const deleted = records.find((record) => record.id === id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.PROCUREMENT]);

    setRecords((current) => persistRecords(current.filter((record) => record.id !== id)));

    if (deleted) {
      recordActivity({
        action: 'delete',
        entityType: 'procurement',
        title: `Deleted procurement order: ${deleted.description}`,
        detail: deleted.supplier,
        undoPayload,
      });
    }
  }, [records]);

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

      const undoPayload = captureStoreSnapshot([STORE_KEYS.SUPPLIER_REGISTRY]);

      setSupplierRegistry((current) =>
        persistSupplierRegistry({
          supplierNames: [...current.supplierNames, trimmedName].sort((left, right) =>
            left.localeCompare(right),
          ),
        }),
      );

      recordActivity({
        action: 'create',
        entityType: 'supplier',
        title: `Added supplier: ${trimmedName}`,
        undoPayload,
      });

      return null;
    },
    [records, supplierRegistry],
  );

  const replaceFromFile = useCallback(async (file: File) => {
    const undoPayload = captureStoreSnapshot([STORE_KEYS.PROCUREMENT]);
    const buffer = await file.arrayBuffer();
    const parsed = parseProcurementWorkbook(buffer);
    setRecords(parsed);
    saveProcurementRecords(parsed);

    recordActivity({
      action: 'import',
      entityType: 'procurement',
      title: `Imported procurement workbook (${parsed.length} orders)`,
      detail: file.name,
      undoPayload,
    });

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
