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
import type { ProcurementRecord, ProcurementRecordInput } from '@/types/procurement';

type ProcurementContextValue = {
  records: ProcurementRecord[];
  addRecord: (record: ProcurementRecordInput) => void;
  updateRecord: (record: ProcurementRecord) => void;
  deleteRecord: (id: number) => void;
  replaceFromFile: (file: File) => Promise<number>;
};

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

function persistRecords(records: ProcurementRecord[]): ProcurementRecord[] {
  saveProcurementRecords(records);
  return records;
}

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ProcurementRecord[]>(() => loadProcurementRecords());

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
      addRecord,
      updateRecord,
      deleteRecord,
      replaceFromFile,
    }),
    [records, addRecord, updateRecord, deleteRecord, replaceFromFile],
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
