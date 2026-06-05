import { useActivityLog } from '@/context/ActivityLogContext';
import { formatActivityTimestamp, summarizeActivityLog } from '@/lib/activityLog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ActivityLogTab() {
  const { entries, refreshEntries, undoEntry } = useActivityLog();
  const { undoableCount, totalCount } = summarizeActivityLog(entries);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All changes are kept for 30 days. Undo restores the previous state.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {undoableCount} undoable · {totalCount} total (last 30 days)
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={refreshEntries}>
              Refresh
            </Button>
          </div>

          {entries.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              No activity recorded yet. Changes you make will appear here.
            </p>
          ) : (
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-semibold text-foreground">{entry.title}</p>
                    {entry.detail && (
                      <p className="text-sm text-muted-foreground">{entry.detail}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      By <span className="font-medium text-foreground">{entry.actor}</span> ·{' '}
                      {formatActivityTimestamp(entry.createdAt)}
                    </p>

                    {entry.changes.length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {entry.changes.map((change) => (
                          <li key={`${entry.id}-${change.field}`} className="flex flex-wrap gap-1">
                            <span className="font-medium text-foreground">{change.field}</span>
                            <span className="text-expense">{change.before || '--'}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-income">{change.after || '--'}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {entry.undoneAt && (
                      <p className="text-sm text-muted-foreground">
                        Undone · {formatActivityTimestamp(entry.undoneAt)}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={entry.undoneAt !== null}
                      onClick={() => undoEntry(entry.id)}
                    >
                      Undo
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
