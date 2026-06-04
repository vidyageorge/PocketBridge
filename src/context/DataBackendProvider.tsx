import { useEffect, useState, type ReactNode } from 'react';
import { initDataBackend, type DataBackendMode } from '@/lib/dataBackend';

type DataBackendProviderProps = {
  children: ReactNode;
};

/**
 * Loads data from the SQLite API or localStorage before the app renders.
 */
export function DataBackendProvider({ children }: DataBackendProviderProps) {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<DataBackendMode>('local');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    initDataBackend()
      .then((backendMode) => {
        if (!cancelled) {
          setMode(backendMode);
          setReady(true);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load saved data',
          );
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading PocketBridge data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="max-w-md text-center text-sm text-expense">{error}</p>
      </div>
    );
  }

  return (
    <>
      {mode === 'api' && (
        <div className="border-b border-border bg-nav-navy/5 px-4 py-2 text-center text-xs text-muted-foreground">
          Saving to SQLite database on this computer
        </div>
      )}
      {children}
    </>
  );
}
