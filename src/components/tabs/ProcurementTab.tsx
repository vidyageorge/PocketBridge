import { useMemo, useState } from 'react';
import { MONTHS } from '@/lib/constants';
import {
  applyProcurementColumnFilters,
  computeProcurementSummary,
  filterProcurementRecords,
  getLatestProcurementPeriod,
  sortProcurementByOrderDateDesc,
} from '@/lib/procurement';
import { useProcurement } from '@/context/ProcurementContext';
import { ProcurementForm } from '@/components/procurement/ProcurementForm';
import { ProcurementImport } from '@/components/procurement/ProcurementImport';
import { ProcurementMetricCards } from '@/components/procurement/ProcurementMetricCards';
import { ProcurementMonthFilter as ProcurementMonthFilterControl } from '@/components/procurement/ProcurementMonthFilter';
import { ProcurementTable } from '@/components/procurement/ProcurementTable';
import {
  EMPTY_PROCUREMENT_FILTERS,
  type ProcurementColumnFilters,
  type ProcurementRecord,
} from '@/types/procurement';

export function ProcurementTab() {
  const { records, addRecord, updateRecord, deleteRecord } = useProcurement();
  const defaultPeriod = useMemo(() => getLatestProcurementPeriod(records), [records]);

  const [month, setMonth] = useState(defaultPeriod.month);
  const [year, setYear] = useState(defaultPeriod.year);
  const [columnFilters, setColumnFilters] =
    useState<ProcurementColumnFilters>(EMPTY_PROCUREMENT_FILTERS);
  const [editingRecord, setEditingRecord] = useState<ProcurementRecord | null>(null);

  const filteredByPeriod = useMemo(
    () => filterProcurementRecords(records, month, year),
    [records, month, year],
  );

  const filteredByColumns = useMemo(
    () => applyProcurementColumnFilters(filteredByPeriod, columnFilters),
    [filteredByPeriod, columnFilters],
  );

  const displayedRecords = useMemo(
    () => sortProcurementByOrderDateDesc(filteredByColumns),
    [filteredByColumns],
  );

  const summary = useMemo(() => computeProcurementSummary(displayedRecords), [displayedRecords]);

  const handleFilterChange = (field: keyof ProcurementColumnFilters, value: string) => {
    setColumnFilters((current) => ({ ...current, [field]: value }));
  };

  const handleDelete = (id: number) => {
    deleteRecord(id);
    if (editingRecord?.id === id) {
      setEditingRecord(null);
    }
  };

  const monthLabel = MONTHS.find((monthOption) => monthOption.value === month)?.label ?? month;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Procurement</h2>

      <ProcurementImport />

      <ProcurementMonthFilterControl
        month={month}
        year={year}
        records={records}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      <ProcurementForm
        sheetMonth={month}
        sheetYear={year}
        editingRecord={editingRecord}
        onAdd={addRecord}
        onUpdate={updateRecord}
        onCancelEdit={() => setEditingRecord(null)}
      />

      <ProcurementMetricCards summary={summary} />

      <ProcurementTable
        records={displayedRecords}
        optionRecords={filteredByPeriod}
        filters={columnFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setColumnFilters(EMPTY_PROCUREMENT_FILTERS)}
        onEdit={setEditingRecord}
        onDelete={handleDelete}
        title={`${monthLabel} ${year} — ${displayedRecords.length} orders`}
      />
    </div>
  );
}
