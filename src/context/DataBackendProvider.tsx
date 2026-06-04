import { useEffect, useState, type ReactNode } from 'react';
import { initDataBackend, pushLocalStorageToApi, type DataBackendMode } from '@/lib/dataBackend';
import { Button } from '@/components/ui/button';

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
  const [pushing, setPushing] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

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

  const handlePushLocalToCloud = async () => {
    setPushing(true);
    setPushMessage(null);
    try {
      const keys = await pushLocalStorageToApi();
      setPushMessage(`Uploaded ${keys.length} data bundle(s) to the server database.`);
      window.location.reload();
    } catch (pushError) {
      setPushMessage(
        pushError instanceof Error ? pushError.message : 'Upload to server failed.',
      );
    } finally {
      setPushing(false);
    }
  };

  return (
    <>
      {mode === 'api' && (
        <div className="border-b border-border bg-nav-navy/5 px-4 py-2 text-center text-xs text-muted-foreground">
          Saving to cloud database via API
          <span className="mt-1 block">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 h-7 text-xs"
              disabled={pushing}
              onClick={() => void handlePushLocalToCloud()}
            >
              {pushing ? 'Uploading…' : 'Upload browser data to database'}
            </Button>
            {pushMessage && <span className="mt-1 block text-expense">{pushMessage}</span>}
          </span>
        </div>
      )}
      {children}
    </>
  );
}
