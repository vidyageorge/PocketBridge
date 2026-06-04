import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  applyProcurementColumnFilters,
  computeProcurementSummary,
  filterProcurementBySupplier,
  filterProcurementRecords,
  getDefaultSupplierName,
  getLatestProcurementPeriod,
  getSupplierList,
  sortProcurementByOrderDateDesc,
} from '@/lib/procurement';
import { useProcurement } from '@/context/ProcurementContext';
import { ProcurementImport } from '@/components/procurement/ProcurementImport';
import { ProcurementMetricCards } from '@/components/procurement/ProcurementMetricCards';
import { ProcurementMonthFilter as ProcurementMonthFilterControl } from '@/components/procurement/ProcurementMonthFilter';
import { ProcurementTable } from '@/components/procurement/ProcurementTable';
import { AddSupplierForm } from '@/components/suppliers/AddSupplierForm';
import { SupplierListButtons } from '@/components/suppliers/SupplierListButtons';
import { Card, CardContent } from '@/components/ui/card';
import {
  EMPTY_PROCUREMENT_FILTERS,
  type ProcurementColumnFilters,
} from '@/types/procurement';

/**
 * Supplier-focused view of material procurement and payments.
 */
export function SuppliersTab() {
  const { records, supplierRegistry, deleteRecord } = useProcurement();
  const defaultPeriod = useMemo(() => getLatestProcurementPeriod(records), [records]);

  const [month, setMonth] = useState(defaultPeriod.month);
  const [year, setYear] = useState(defaultPeriod.year);
  const [selectedSupplier, setSelectedSupplier] = useState(() =>
    getDefaultSupplierName(records, supplierRegistry),
  );
  const [columnFilters, setColumnFilters] =
    useState<ProcurementColumnFilters>(EMPTY_PROCUREMENT_FILTERS);

  const filteredByPeriod = useMemo(
    () => filterProcurementRecords(records, month, year),
    [records, month, year],
  );

  useEffect(() => {
    const suppliers = getSupplierList(records, supplierRegistry);
    if (!suppliers.some((supplier) => supplier.supplierName === selectedSupplier)) {
      const nextDefault = getDefaultSupplierName(records, supplierRegistry);
      if (nextDefault) {
        setSelectedSupplier(nextDefault);
      }
    }
  }, [records, supplierRegistry, selectedSupplier]);

  const supplierRecords = useMemo(
    () => filterProcurementBySupplier(filteredByPeriod, selectedSupplier),
    [filteredByPeriod, selectedSupplier],
  );

  const displayedRecords = useMemo(
    () =>
      sortProcurementByOrderDateDesc(
        applyProcurementColumnFilters(supplierRecords, columnFilters),
      ),
    [supplierRecords, columnFilters],
  );

  const summary = useMemo(() => computeProcurementSummary(displayedRecords), [displayedRecords]);

  const selectedSupplierMeta = useMemo(() => {
    const fromPeriod = getSupplierList(filteredByPeriod, supplierRegistry).find(
      (row) => row.supplierName === selectedSupplier,
    );
    if (fromPeriod) {
      return fromPeriod;
    }
    return getSupplierList(records, supplierRegistry).find(
      (row) => row.supplierName === selectedSupplier,
    );
  }, [filteredByPeriod, records, supplierRegistry, selectedSupplier]);

  const handleFilterChange = (field: keyof ProcurementColumnFilters, value: string) => {
    setColumnFilters((current) => ({ ...current, [field]: value }));
  };

  const handleDelete = (id: number) => {
    const record = records.find((entry) => entry.id === id);
    const label = record?.description ?? 'this order';
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      return;
    }
    deleteRecord(id);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Suppliers</h2>

      <ProcurementImport />

      <ProcurementMonthFilterControl
        month={month}
        year={year}
        records={records}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      <AddSupplierForm
        onSupplierAdded={(supplier) => {
          setSelectedSupplier(supplier);
          setColumnFilters(EMPTY_PROCUREMENT_FILTERS);
        }}
      />

      <SupplierListButtons
        selectedSupplier={selectedSupplier}
        onSupplierChange={(supplier) => {
          setSelectedSupplier(supplier);
          setColumnFilters(EMPTY_PROCUREMENT_FILTERS);
        }}
      />

      {selectedSupplierMeta && (
        <Card className="border-border/80 bg-white/95">
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Orders
              </p>
              <p className="text-sm font-medium">{selectedSupplierMeta.orderCount}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total spent
              </p>
              <p className="text-sm font-medium text-expense">
                {formatCurrency(selectedSupplierMeta.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Projects
              </p>
              <p className="text-sm font-medium">
                {selectedSupplierMeta.projects.length > 0
                  ? selectedSupplierMeta.projects.join(', ')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pending
              </p>
              <p className="text-sm font-medium text-expense">
                {formatCurrency(selectedSupplierMeta.pendingAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <ProcurementMetricCards summary={summary} />

      <ProcurementTable
        records={displayedRecords}
        optionRecords={supplierRecords}
        filters={columnFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setColumnFilters(EMPTY_PROCUREMENT_FILTERS)}
        onDelete={handleDelete}
        title={`${selectedSupplier} — orders`}
      />
    </div>
  );
}
