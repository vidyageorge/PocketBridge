import { useCallback, useState, type DragEvent } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { parseBankStatementFile } from '@/lib/bankStatement';
import { inferCategoryFromDescription } from '@/lib/categorize';
import { formatCurrency } from '@/lib/currency';
import { inferStatementPeriod } from '@/lib/filters';
import { usePeriodFilter } from '@/context/PeriodFilterContext';
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
  closingBalance?: number;
  asOnDate?: string;
};

export function BankStatementImport() {
  const { importTransactions } = useTransactions();
  const { setPeriod } = usePeriodFilter();
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
      if (!extension || !['csv', 'xlsx', 'xls', 'pdf'].includes(extension)) {
        setError('Please upload a CSV, Excel, or PDF statement from ICICI.');
        setIsProcessing(false);
        return;
      }

      try {
        const parsed = await parseBankStatementFile(file);

        if (parsed.entries.length === 0 && !parsed.statementSummary) {
          setError(
            'Could not read this statement. Use the ICICI CSV export or the monthly PDF from net banking.',
          );
          setIsProcessing(false);
          return;
        }

        if (parsed.entries.length === 0 && parsed.statementSummary) {
          window.alert(
            `Closing balance saved: ${formatCurrency(parsed.statementSummary.balance)} as on ${parsed.statementSummary.asOnDate}. Transaction lines were not detected in this PDF — export CSV from ICICI for the full table.`,
          );
        }

        importTransactions(
          parsed.entries.map((entry) => ({
            date: entry.date,
            valueDate: entry.valueDate,
            description: entry.description,
            location: entry.location,
            chqNo: entry.chqNo,
            mode: entry.mode,
            withdrawal: entry.withdrawal,
            deposit: entry.deposit,
            balance: entry.balance,
            category: inferCategoryFromDescription(entry.description, entry.type),
            type: entry.type,
            amount: entry.amount,
            source: 'bank',
          })),
          {
            statementSummary: parsed.statementSummary,
            fileName: file.name,
          },
        );

        const dates = parsed.entries.map((entry) => entry.date);
        if (parsed.statementSummary) {
          dates.push(parsed.statementSummary.asOnDate);
        }
        const period = inferStatementPeriod(file.name, dates);
        if (period) {
          setPeriod(period);
        }

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
          closingBalance: parsed.statementSummary?.balance,
          asOnDate: parsed.statementSummary?.asOnDate,
          ...summary,
        });
      } catch {
        setError('Unable to read this file. Try the ICICI CSV or PDF statement download.');
      } finally {
        setIsProcessing(false);
      }
    },
    [importTransactions, setPeriod],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Bank Statement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <p className="mb-4 text-sm font-medium">
            {isProcessing ? 'Processing statement…' : 'Drop your ICICI statement (CSV or PDF)'}
          </p>
          <label className={`cursor-pointer ${isProcessing ? 'hidden' : ''}`}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void processFile(file);
                }
                event.target.value = '';
              }}
            />
            <span className="inline-flex h-10 items-center justify-center rounded-md bg-nav-navy px-4 py-2 text-sm font-medium text-nav-navy-foreground hover:bg-nav-navy/90">
              Choose Statement File
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        {result && (
          <div className="rounded-lg border border-border bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">
                {result.imported > 0
                  ? `${result.imported} transactions imported from ${result.fileName}`
                  : `Statement summary saved from ${result.fileName}`}
              </p>
            </div>
            {result.closingBalance !== undefined && (
              <p className="text-sm font-medium text-income">
                Closing balance
                {result.asOnDate ? ` (as on ${result.asOnDate})` : ''}:{' '}
                {formatCurrency(result.closingBalance)}
              </p>
            )}
            {result.imported > 0 && (
              <>
                <p className="text-sm text-income">
                  {result.incomeCount} credits — {formatCurrency(result.totalIncome)}
                </p>
                <p className="text-sm text-expense">
                  {result.expenseCount} debits — {formatCurrency(result.totalExpense)}
                </p>
              </>
            )}
            {result.skipped > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{result.skipped} rows skipped</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
