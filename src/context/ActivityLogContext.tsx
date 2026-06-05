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
  applyUndoPayload,
  createActivityLogEntry,
  filterRetainedEntries,
  pruneExpiredEntries,
} from '@/lib/activityLog';
import { setActivityLogRecorder } from '@/lib/activityLogRecorder';
import { loadActivityLogEntries, saveActivityLogEntries } from '@/lib/activityLogStorage';
import type { ActivityLogEntry, RecordActivityInput } from '@/types/activityLog';

type ActivityLogContextValue = {
  entries: ActivityLogEntry[];
  refreshEntries: () => void;
  undoEntry: (id: string) => void;
};

const ActivityLogContext = createContext<ActivityLogContextValue | null>(null);

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>(() =>
    filterRetainedEntries(loadActivityLogEntries()),
  );

  const persistEntries = useCallback((nextEntries: ActivityLogEntry[]) => {
    const pruned = pruneExpiredEntries(nextEntries);
    saveActivityLogEntries(pruned);
    setEntries(filterRetainedEntries(pruned));
  }, []);

  const appendEntry = useCallback(
    (input: RecordActivityInput) => {
      const entry = createActivityLogEntry(input);
      setEntries((current) => {
        const nextEntries = [entry, ...current];
        saveActivityLogEntries(pruneExpiredEntries(nextEntries));
        return filterRetainedEntries(nextEntries);
      });
    },
    [],
  );

  useEffect(() => {
    setActivityLogRecorder(appendEntry);
    return () => setActivityLogRecorder(null);
  }, [appendEntry]);

  const refreshEntries = useCallback(() => {
    setEntries(filterRetainedEntries(loadActivityLogEntries()));
  }, []);

  const undoEntry = useCallback(
    (id: string) => {
      const target = entries.find((entry) => entry.id === id);
      if (!target || target.undoneAt !== null) {
        return;
      }

      applyUndoPayload(target.undoPayload);

      const nextEntries = entries.map((entry) =>
        entry.id === id ? { ...entry, undoneAt: new Date().toISOString() } : entry,
      );
      persistEntries(nextEntries);
      window.location.reload();
    },
    [entries, persistEntries],
  );

  const value = useMemo(
    () => ({
      entries,
      refreshEntries,
      undoEntry,
    }),
    [entries, refreshEntries, undoEntry],
  );

  return <ActivityLogContext.Provider value={value}>{children}</ActivityLogContext.Provider>;
}

export function useActivityLog(): ActivityLogContextValue {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error('useActivityLog must be used within ActivityLogProvider');
  }
  return context;
}
