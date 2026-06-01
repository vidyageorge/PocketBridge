import { useCallback, useState, type DragEvent } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { parseBankStatementFile } from '@/lib/bankStatement';
import { inferCategoryFromDescription } from '@/lib/categorize';
import { formatCurrency } from '@/lib/currency';
import { useTransactions } from '@/context/TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ImportResult = {
  fileName: string;
  imported: number;
  incomeCount: number;
  expenseCount: number;
  totalIncome: number;
  totalExpense: number;
  skipped: number;
};

export function BankStatementImport() {
  const { importTransactions } = useTransactions();
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError('');
      setResult(null);
      setIsProcessing(true);

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
        setError('Please upload a CSV or Excel file exported from your bank.');
        setIsProcessing(false);
        return;
      }

      try {
        const parsed = await parseBankStatementFile(file);

        if (parsed.entries.length === 0) {
          setError(
            parsed.skipped.length > 0
              ? `Could not read transactions from this file (${parsed.skipped.length} rows skipped). Export the statement as Excel or CSV from your bank app and try again.`
              : 'No transactions found in this file. Make sure it is a bank statement with date, description, and debit/credit columns.',
          );
          setIsProcessing(false);
          return;
        }

        importTransactions(
          parsed.entries.map((entry) => ({
            date: entry.date,
            description: entry.description,
            category: inferCategoryFromDescription(entry.description, entry.type),
            type: entry.type,
            amount: entry.amount,
            source: 'bank',
          })),
        );

        const summary = parsed.entries.reduce(
          (accumulator, entry) => {
            if (entry.type === 'income') {
              accumulator.incomeCount += 1;
              accumulator.totalIncome += entry.amount;
            } else {
              accumulator.expenseCount += 1;
              accumulator.totalExpense += entry.amount;
            }
            return accumulator;
          },
          { incomeCount: 0, expenseCount: 0, totalIncome: 0, totalExpense: 0 },
        );

        setResult({
          fileName: file.name,
          imported: parsed.entries.length,
          skipped: parsed.skipped.length,
          ...summary,
        });
      } catch {
        setError('Unable to read this file. Export your bank statement as Excel (.xlsx) or CSV and upload again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [importTransactions],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Bank Statement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload any bank statement (CSV or Excel from HDFC, ICICI, SBI, Axis, etc.). The app reads
          debits and credits automatically and adds them to your Bank Account — no template needed.
        </p>

        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              void processFile(file);
            }
          }}
        >
          {isProcessing ? (
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
          )}
          <p className="mb-2 text-sm font-medium">
            {isProcessing ? 'Processing statement…' : 'Drop your bank statement here'}
          </p>
          <p className="mb-4 text-xs text-muted-foreground">CSV, XLSX, or XLS — any bank format</p>
          <label className={`cursor-pointer ${isProcessing ? 'hidden' : ''}`}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void processFile(file);
                }
                event.target.value = '';
              }}
            />
            <span className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Choose Statement File
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        {result && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">
                {result.imported} transactions imported from {result.fileName}
              </p>
            </div>
            <p className="text-sm text-income">
              {result.incomeCount} credits — {formatCurrency(result.totalIncome)}
            </p>
            <p className="text-sm text-expense">
              {result.expenseCount} debits — {formatCurrency(result.totalExpense)}
            </p>
            {result.skipped > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{result.skipped} rows skipped</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              See them in the table below. Upload another file anytime to add more.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
