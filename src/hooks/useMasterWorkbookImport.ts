import { useCallback } from 'react';
import { captureStoreSnapshot } from '@/lib/activityLog';
import { recordActivity } from '@/lib/activityLogRecorder';
import { parseMasterWorkbook, type MasterWorkbookImportResult } from '@/lib/masterWorkbook';
import { STORE_KEYS } from '@/lib/storeKeys';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { useExpenses } from '@/context/ExpenseContext';
import { useProcurement } from '@/context/ProcurementContext';

export type MasterImportSummary = MasterWorkbookImportResult;

export function useMasterWorkbookImport() {
  const { importParsedData: importExpenses } = useExpenses();
  const { importParsedData: importProcurement } = useProcurement();
  const { importParsedData: importClientPayments } = useClientPayments();

  const importFromFile = useCallback(
    async (file: File): Promise<MasterImportSummary> => {
      const undoPayload = captureStoreSnapshot([
        STORE_KEYS.EXPENSES,
        STORE_KEYS.PROCUREMENT,
        STORE_KEYS.SUPPLIER_REGISTRY,
        STORE_KEYS.CLIENT_PAYMENTS,
        STORE_KEYS.CLIENT_PAYMENT_REGISTRY,
        STORE_KEYS.TRANSACTIONS,
      ]);

      const buffer = await file.arrayBuffer();
      const result = parseMasterWorkbook(buffer);

      importExpenses(result.expenses, file.name);
      importProcurement(result.procurement, file.name);
      importClientPayments(result.clientPayments, file.name);

      recordActivity({
        action: 'import',
        entityType: 'expense_project',
        title: `Imported master workbook (${result.expenseLineCount} expenses, ${result.procurementCount} procurement, ${result.clientPaymentCount} client payments)`,
        detail: file.name,
        undoPayload,
      });

      return result;
    },
    [importExpenses, importProcurement, importClientPayments],
  );

  return { importFromFile };
}
