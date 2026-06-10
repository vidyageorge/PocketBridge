import { MasterWorkbookImport } from '@/components/import/MasterWorkbookImport';

export function DataImportTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Data Import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Import projects, expenses, procurement, and suppliers from a single Excel workbook.
          Bank statements are imported separately on the Bank Account tab.
        </p>
      </div>

      <MasterWorkbookImport />
    </div>
  );
}
