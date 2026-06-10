import { useCallback, useState, type DragEvent } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import type { MasterImportSummary } from '@/hooks/useMasterWorkbookImport';
import { useMasterWorkbookImport } from '@/hooks/useMasterWorkbookImport';

const SHEET_TYPE_LABELS: Record<string, string> = {
  client_payment: 'Project / client payments',
  procurement: 'Procurement & suppliers',
  expense: 'Expenses & employee salary',
};

function formatSheetSummary(sheets: MasterImportSummary['sheets']): string {
  const counts = new Map<string, number>();
  for (const sheet of sheets) {
    const label = SHEET_TYPE_LABELS[sheet.type] ?? sheet.type;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => `${count} ${label}`).join(', ');
}

export function MasterWorkbookImport() {
  const { importFromFile } = useMasterWorkbookImport();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<MasterImportSummary | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError('');
      setSummary(null);
      setIsProcessing(true);

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['xlsx', 'xls'].includes(extension)) {
        setError('Please upload the master Excel workbook (.xlsx or .xls).');
        setIsProcessing(false);
        return;
      }

      try {
        const result = await importFromFile(file);
        const totalRows =
          result.expenseLineCount + result.procurementCount + result.clientPaymentCount;

        if (totalRows === 0) {
          setError(
            'No data found. The workbook should include sheets for projects, monthly expenses, and procurement.',
          );
          setIsProcessing(false);
          return;
        }

        setSummary(result);
      } catch {
        setError('Unable to read this file. Check that sheets follow the expected layouts.');
      } finally {
        setIsProcessing(false);
      }
    },
    [importFromFile],
  );

  return (
    <div className="pb-content-card rounded-xl p-4">
      <p className="mb-4 text-sm text-muted-foreground">
        Upload one Excel workbook. Sheets are detected automatically: project tabs (P-01, P-02),
        monthly expense summaries (MAY-25, JUNE-25), and procurement sheets (May-25, June-25).
        Cash ledger entries are derived from client payment cash amounts.
      </p>

      <div
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 ${
          isProcessing ? 'opacity-60' : ''
        }`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) {
            void processFile(file);
          }
        }}
      >
        {isProcessing ? (
          <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
        ) : (
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        )}
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void processFile(file);
              }
              event.target.value = '';
            }}
          />
          <span className="inline-flex h-9 items-center rounded-md bg-nav-navy px-3 text-sm font-medium text-nav-navy-foreground">
            Upload master workbook
          </span>
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-expense">{error}</p>}

      {summary && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Workbook imported successfully.
          </p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>{summary.clientPaymentCount} client payment lines across project sheets</li>
            <li>{summary.expenseLineCount} expense lines (projects + employee salary)</li>
            <li>{summary.procurementCount} procurement orders (suppliers inferred)</li>
            <li>Cash ledger updates automatically from project cash amounts</li>
            <li>Sheets read: {formatSheetSummary(summary.sheets)}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
