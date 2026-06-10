import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { buildFieldChanges, captureStoreSnapshot } from '@/lib/activityLog';
import { recordActivity } from '@/lib/activityLogRecorder';
import {
  buildClientPaymentRecord,
  getClientProjectMeta,
  isProjectCompleted,
  mergeClientPaymentRegistry,
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
import { STORE_KEYS } from '@/lib/storeKeys';
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
  importParsedData: (records: ClientPaymentRecord[], fileName: string) => number;
  addProject: (input: AddClientProjectInput) => string | null;
  addClient: (clientName: string) => string | null;
  addPayment: (input: ClientPaymentInput, useSplitAmounts: boolean) => boolean;
  updatePayment: (record: ClientPaymentRecord) => void;
  deletePayment: (id: number) => void;
  completeProject: (sheetProject: string) => string | null;
  reactivateProject: (sheetProject: string) => string | null;
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
    const undoPayload = captureStoreSnapshot([
      STORE_KEYS.CLIENT_PAYMENTS,
      STORE_KEYS.CLIENT_PAYMENT_REGISTRY,
    ]);
    const buffer = await file.arrayBuffer();
    const parsed = parseClientPaymentWorkbook(buffer);
    setRecords(parsed);
    saveClientPaymentRecords(parsed);
    setRegistry((current) =>
      persistRegistry(mergeClientPaymentRegistry(buildClientPaymentRegistry(parsed), current)),
    );

    recordActivity({
      action: 'import',
      entityType: 'client_payment',
      title: `Imported client payments workbook (${parsed.length} entries)`,
      detail: file.name,
      undoPayload,
    });

    return parsed.length;
  }, []);

  const importParsedData = useCallback((parsed: ClientPaymentRecord[], _fileName: string) => {
    setRecords(parsed);
    saveClientPaymentRecords(parsed);
    setRegistry((current) =>
      persistRegistry(mergeClientPaymentRegistry(buildClientPaymentRegistry(parsed), current)),
    );
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
      status: 'active' as const,
    };

    let addError: string | null = null;

    const existsInPayments = records.some((record) => record.sheetProject === sheetProject);

    const undoPayload = captureStoreSnapshot([STORE_KEYS.CLIENT_PAYMENT_REGISTRY]);

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

    if (!addError) {
      recordActivity({
        action: 'create',
        entityType: 'project',
        title: `Added project: ${nextProject.projectName}`,
        detail: sheetProject,
        undoPayload,
      });
    }

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

      const undoPayload = captureStoreSnapshot([STORE_KEYS.CLIENT_PAYMENT_REGISTRY]);

      setRegistry((current) =>
        persistRegistry({
          ...current,
          clientNames: [...current.clientNames, trimmedName].sort((left, right) =>
            left.localeCompare(right),
          ),
        }),
      );

      recordActivity({
        action: 'create',
        entityType: 'client',
        title: `Added client: ${trimmedName}`,
        undoPayload,
      });

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

      const undoPayload = captureStoreSnapshot([STORE_KEYS.CLIENT_PAYMENTS]);

      setRecords((current) => persistRecords([...current, nextRecord]));

      recordActivity({
        action: 'create',
        entityType: 'client_payment',
        title: `Added client payment: ${nextRecord.description}`,
        detail: nextRecord.clientName,
        undoPayload,
      });

      return true;
    },
    [records, registry],
  );

  const updatePayment = useCallback((record: ClientPaymentRecord) => {
    const before = records.find((existing) => existing.id === record.id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.CLIENT_PAYMENTS]);

    setRecords((current) =>
      persistRecords(current.map((existing) => (existing.id === record.id ? record : existing))),
    );

    if (before) {
      recordActivity({
        action: 'update',
        entityType: 'client_payment',
        title: `Updated client payment: ${record.description}`,
        detail: record.clientName,
        changes: buildFieldChanges(
          before as unknown as Record<string, unknown>,
          record as unknown as Record<string, unknown>,
          [
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount' },
            { key: 'paymentDate', label: 'Payment date' },
          ],
        ),
        undoPayload,
      });
    }
  }, [records]);

  const deletePayment = useCallback((id: number) => {
    const deleted = records.find((record) => record.id === id);
    const undoPayload = captureStoreSnapshot([STORE_KEYS.CLIENT_PAYMENTS]);

    setRecords((current) => persistRecords(current.filter((record) => record.id !== id)));

    if (deleted) {
      recordActivity({
        action: 'delete',
        entityType: 'client_payment',
        title: `Deleted client payment: ${deleted.description}`,
        detail: deleted.clientName,
        undoPayload,
      });
    }
  }, [records]);

  const updateProjectStatus = useCallback(
    (
      sheetProject: string,
      status: 'active' | 'completed',
      completedAt?: string,
    ): string | null => {
      const normalizedProject = normalizeSheetProjectLabel(sheetProject);
      const meta = getClientProjectMeta(records, registry, normalizedProject);
      if (!meta) {
        return 'Project not found.';
      }

      if (status === 'completed' && isProjectCompleted(meta)) {
        return 'Project is already completed.';
      }

      if (status === 'active' && !isProjectCompleted(meta)) {
        return 'Project is already active.';
      }

      const undoPayload = captureStoreSnapshot([STORE_KEYS.CLIENT_PAYMENT_REGISTRY]);
      const completionDate = completedAt ?? new Date().toISOString().slice(0, 10);

      setRegistry((current) => {
        const existsInRegistry = current.projects.some(
          (project) => project.sheetProject === normalizedProject,
        );
        const nextProjects = existsInRegistry
          ? current.projects.map((project) =>
              project.sheetProject === normalizedProject
                ? {
                    ...project,
                    status,
                    completedAt: status === 'completed' ? completionDate : undefined,
                  }
                : project,
            )
          : [
              ...current.projects,
              {
                ...meta,
                status,
                completedAt: status === 'completed' ? completionDate : undefined,
              },
            ];

        return persistRegistry({
          ...current,
          projects: nextProjects.sort((left, right) =>
            left.sheetProject.localeCompare(right.sheetProject),
          ),
        });
      });

      recordActivity({
        action: 'update',
        entityType: 'project',
        title:
          status === 'completed'
            ? `Marked project as completed: ${meta.projectName || normalizedProject}`
            : `Reactivated project: ${meta.projectName || normalizedProject}`,
        detail: normalizedProject,
        undoPayload,
      });

      return null;
    },
    [records, registry],
  );

  const completeProject = useCallback(
    (sheetProject: string) => updateProjectStatus(sheetProject, 'completed'),
    [updateProjectStatus],
  );

  const reactivateProject = useCallback(
    (sheetProject: string) => updateProjectStatus(sheetProject, 'active'),
    [updateProjectStatus],
  );

  const value = useMemo(
    () => ({
      records,
      registry,
      replaceFromFile,
      importParsedData,
      addProject,
      addClient,
      addPayment,
      updatePayment,
      deletePayment,
      completeProject,
      reactivateProject,
    }),
    [
      records,
      registry,
      replaceFromFile,
      importParsedData,
      addProject,
      addClient,
      addPayment,
      updatePayment,
      deletePayment,
      completeProject,
      reactivateProject,
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
