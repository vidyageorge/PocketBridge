import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildClientPaymentRecord,
  normalizeSheetProjectLabel,
  parseClientPaymentWorkbook,
  validateAddClientProjectInput,
} from '@/lib/clientPayment';
import {
  ensureClientPaymentRegistry,
  loadClientPaymentRecords,
  saveClientPaymentRecords,
} from '@/lib/clientPaymentStorage';
import { buildClientPaymentRegistry } from '@/lib/clientPayment';
import {
  loadClientPaymentRegistry,
  saveClientPaymentRegistry,
} from '@/lib/clientPaymentRegistryStorage';
import type {
  AddClientProjectInput,
  ClientPaymentInput,
  ClientPaymentRecord,
  ClientPaymentRegistry,
} from '@/types/clientPayment';

type ClientPaymentContextValue = {
  records: ClientPaymentRecord[];
  registry: ClientPaymentRegistry;
  replaceFromFile: (file: File) => Promise<number>;
  addProject: (input: AddClientProjectInput) => string | null;
  addClient: (clientName: string) => string | null;
  addPayment: (input: ClientPaymentInput, useSplitAmounts: boolean) => boolean;
  updatePayment: (record: ClientPaymentRecord) => void;
  deletePayment: (id: number) => void;
};

const ClientPaymentContext = createContext<ClientPaymentContextValue | null>(null);

function persistRecords(records: ClientPaymentRecord[]): ClientPaymentRecord[] {
  saveClientPaymentRecords(records);
  return records;
}

function persistRegistry(registry: ClientPaymentRegistry): ClientPaymentRegistry {
  saveClientPaymentRegistry(registry);
  return registry;
}

export function ClientPaymentProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ClientPaymentRecord[]>(() => {
    const loaded = loadClientPaymentRecords();
    ensureClientPaymentRegistry(loaded);
    return loaded;
  });
  const [registry, setRegistry] = useState<ClientPaymentRegistry>(() => loadClientPaymentRegistry());

  const replaceFromFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseClientPaymentWorkbook(buffer);
    setRecords(parsed);
    saveClientPaymentRecords(parsed);
    setRegistry(persistRegistry(buildClientPaymentRegistry(parsed)));
    return parsed.length;
  }, []);

  useEffect(() => {
    if (registry.projects.length === 0 && records.length > 0) {
      setRegistry(persistRegistry(buildClientPaymentRegistry(records)));
    }
  }, [records, registry.projects.length]);

  const addProject = useCallback((input: AddClientProjectInput): string | null => {
    const validationError = validateAddClientProjectInput(input);
    if (validationError) {
      return validationError;
    }

    const sheetProject = normalizeSheetProjectLabel(input.sheetProject);
    const nextProject = {
      sheetProject,
      projectCode: input.projectCode.trim(),
      projectName: input.projectName.trim(),
      clientName: input.clientName.trim(),
    };

    let addError: string | null = null;

    const existsInPayments = records.some((record) => record.sheetProject === sheetProject);

    setRegistry((current) => {
      if (
        existsInPayments ||
        current.projects.some((project) => project.sheetProject === sheetProject)
      ) {
        addError = `Project ${sheetProject} already exists.`;
        return current;
      }

      const clientNames = current.clientNames.includes(nextProject.clientName)
        ? current.clientNames
        : [...current.clientNames, nextProject.clientName].sort((left, right) =>
            left.localeCompare(right),
          );

      return persistRegistry({
        projects: [...current.projects, nextProject].sort((left, right) =>
          left.sheetProject.localeCompare(right.sheetProject),
        ),
        clientNames,
      });
    });

    return addError;
  }, [records]);

  const addClient = useCallback(
    (clientName: string): string | null => {
      const trimmedName = clientName.trim();
      if (!trimmedName) {
        return 'Enter a client name.';
      }

      const alreadyInPayments = records.some(
        (record) => record.clientName.trim() === trimmedName,
      );
      const alreadyInRegistry =
        registry.clientNames.includes(trimmedName) ||
        registry.projects.some((project) => project.clientName === trimmedName);

      if (alreadyInPayments || alreadyInRegistry) {
        return `Client ${trimmedName} is already listed.`;
      }

      setRegistry((current) =>
        persistRegistry({
          ...current,
          clientNames: [...current.clientNames, trimmedName].sort((left, right) =>
            left.localeCompare(right),
          ),
        }),
      );

      return null;
    },
    [records, registry],
  );

  const addPayment = useCallback(
    (input: ClientPaymentInput, useSplitAmounts: boolean): boolean => {
      const nextRecord = buildClientPaymentRecord(records, registry, input, useSplitAmounts);
      if (!nextRecord) {
        return false;
      }

      setRecords((current) => persistRecords([...current, nextRecord]));
      return true;
    },
    [records, registry],
  );

  const updatePayment = useCallback((record: ClientPaymentRecord) => {
    setRecords((current) =>
      persistRecords(current.map((existing) => (existing.id === record.id ? record : existing))),
    );
  }, []);

  const deletePayment = useCallback((id: number) => {
    setRecords((current) => persistRecords(current.filter((record) => record.id !== id)));
  }, []);

  const value = useMemo(
    () => ({
      records,
      registry,
      replaceFromFile,
      addProject,
      addClient,
      addPayment,
      updatePayment,
      deletePayment,
    }),
    [
      records,
      registry,
      replaceFromFile,
      addProject,
      addClient,
      addPayment,
      updatePayment,
      deletePayment,
    ],
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
