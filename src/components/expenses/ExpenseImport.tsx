import { useCallback, useState, type DragEvent } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { useExpenses } from '@/context/ExpenseContext';

export function ExpenseImport() {
  const { replaceFromFile } = useExpenses();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError('');
      setImportedCount(null);
      setIsProcessing(true);

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['xlsx', 'xls'].includes(extension)) {
        setError('Please upload the summary Excel file (.xlsx or .xls).');
        setIsProcessing(false);
        return;
      }

      try {
        const count = await replaceFromFile(file);
        if (count === 0) {
          setError('No expense rows found. Check that the file has monthly summary sheets (MAY-25, JUNE-25, etc.).');
          setIsProcessing(false);
          return;
        }
        setImportedCount(count);
      } catch {
        setError('Unable to read this file. Use the 01-Summary workbook format.');
      } finally {
        setIsProcessing(false);
      }
    },
    [replaceFromFile],
  );

  return (
    <div className="pb-content-card rounded-xl p-4">
      <div
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 ${
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
            Upload summary Excel
          </span>
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-expense">{error}</p>}
      {importedCount !== null && (
        <p className="mt-2 flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" />
          {importedCount} expense lines loaded from all monthly sheets.
        </p>
      )}
    </div>
  );
}
