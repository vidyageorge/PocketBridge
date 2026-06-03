import { useMemo } from 'react';
import { getDisplaySerialNumber } from '@/lib/tablePagination';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePagination } from '@/components/ui/TablePagination';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import {
  getProcurementColumnOptions,
  PROCUREMENT_BLANK_FILTER,
} from '@/lib/procurement';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProcurementColumnFilters, ProcurementRecord } from '@/types/procurement';

type ProcurementTableProps = {
  records: ProcurementRecord[];
  optionRecords: ProcurementRecord[];
  filters: ProcurementColumnFilters;
  onFilterChange: (field: keyof ProcurementColumnFilters, value: string) => void;
  onClearFilters: () => void;
  onEdit?: (record: ProcurementRecord) => void;
  onDelete?: (id: number) => void;
  title?: string;
};

type FilterFieldConfig = {
  key: keyof ProcurementColumnFilters;
  type: 'select' | 'text';
  placeholder: string;
  align?: 'right';
};

const FILTER_FIELDS: FilterFieldConfig[] = [
  { key: 'sno', type: 'select', placeholder: 'All' },
  { key: 'orderDate', type: 'select', placeholder: 'All dates' },
  { key: 'description', type: 'text', placeholder: 'Search description' },
  { key: 'supplier', type: 'select', placeholder: 'All suppliers' },
  { key: 'billDate', type: 'select', placeholder: 'All' },
  { key: 'deliveryDate', type: 'select', placeholder: 'All' },
  { key: 'project', type: 'select', placeholder: 'All projects' },
  { key: 'invoiceNumber', type: 'select', placeholder: 'All invoices' },
  { key: 'amount', type: 'text', placeholder: 'Search amount', align: 'right' },
  { key: 'orderedBy', type: 'select', placeholder: 'All people' },
  { key: 'paymentStatus', type: 'select', placeholder: 'All statuses' },
  { key: 'paymentDate', type: 'select', placeholder: 'All' },
];

const ALL_FILTER_VALUE = '__all__';

function formatCellDate(value: string): string {
  return value || '—';
}

function formatOptionLabel(value: string): string {
  if (!value) {
    return '(blank)';
  }
  return value;
}

function toSelectValue(filter: string): string {
  if (!filter) {
    return ALL_FILTER_VALUE;
  }
  if (filter === PROCUREMENT_BLANK_FILTER) {
    return PROCUREMENT_BLANK_FILTER;
  }
  return filter;
}

function fromSelectValue(value: string): string {
  if (value === ALL_FILTER_VALUE) {
    return '';
  }
  return value;
}

type ColumnFilterControlProps = {
  field: FilterFieldConfig;
  filterValue: string;
  options: string[];
  onFilterChange: (field: keyof ProcurementColumnFilters, value: string) => void;
};

function ColumnFilterControl({
  field,
  filterValue,
  options,
  onFilterChange,
}: ColumnFilterControlProps) {
  if (field.type === 'text') {
    return (
      <Input
        value={filterValue}
        onChange={(event) => onFilterChange(field.key, event.target.value)}
        placeholder={field.placeholder}
        className={`h-8 text-xs ${field.align === 'right' ? 'text-right' : ''}`}
      />
    );
  }

  return (
    <Select
      value={toSelectValue(filterValue)}
      onValueChange={(value) => onFilterChange(field.key, fromSelectValue(value))}
    >
      <SelectTrigger className={`h-8 text-xs ${field.align === 'right' ? 'text-right' : ''}`}>
        <SelectValue placeholder={field.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_FILTER_VALUE}>{field.placeholder}</SelectItem>
        {options.map((option) => {
          const selectValue = option ? option : PROCUREMENT_BLANK_FILTER;
          return (
            <SelectItem key={selectValue} value={selectValue}>
              {formatOptionLabel(option)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function ProcurementTable({
  records,
  optionRecords,
  filters,
  onFilterChange,
  onClearFilters,
  onEdit,
  onDelete,
  title = 'Procurement entries',
}: ProcurementTableProps) {
  const hasActiveFilters = Object.values(filters).some((value) => value.trim().length > 0);
  const showActions = Boolean(onEdit || onDelete);

  const { paginatedItems, page, setPage, totalPages, totalItems, pageSize } =
    useTablePagination(records);

  const columnOptions = useMemo(() => {
    const options: Partial<Record<keyof ProcurementColumnFilters, string[]>> = {};
    for (const field of FILTER_FIELDS) {
      if (field.type === 'select') {
        options[field.key] = getProcurementColumnOptions(optionRecords, field.key);
      }
    }
    return options;
  }, [optionRecords]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{title}</CardTitle>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear column filters
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No procurement records match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                  <th className="px-2 py-3 font-medium">S.No</th>
                  <th className="px-2 py-3 font-medium">Order Date ↓</th>
                  <th className="px-2 py-3 font-medium">Description</th>
                  <th className="px-2 py-3 font-medium">Supplier</th>
                  <th className="px-2 py-3 font-medium">Bill Date</th>
                  <th className="px-2 py-3 font-medium">Delivery Date</th>
                  <th className="px-2 py-3 font-medium">Project</th>
                  <th className="px-2 py-3 font-medium">Invoice No.</th>
                  <th className="px-2 py-3 font-medium text-right">Amount</th>
                  <th className="px-2 py-3 font-medium">Ordered By</th>
                  <th className="px-2 py-3 font-medium">Payment Status</th>
                  <th className="px-2 py-3 font-medium">Payment Date</th>
                  {showActions && <th className="px-2 py-3 font-medium text-right">Actions</th>}
                </tr>
                <tr className="border-b border-border bg-muted/50">
                  {FILTER_FIELDS.map((field) => (
                    <th key={field.key} className="px-2 py-2">
                      <ColumnFilterControl
                        field={field}
                        filterValue={filters[field.key]}
                        options={columnOptions[field.key] ?? []}
                        onFilterChange={onFilterChange}
                      />
                    </th>
                  ))}
                  {showActions && <th className="px-2 py-2" />}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((record, rowIndex) => {
                  const isCompleted = record.paymentStatus.toLowerCase().includes('completed');

                  return (
                    <tr key={record.id} className="border-b border-border/60">
                      <td className="px-2 py-3">
                        {getDisplaySerialNumber(rowIndex, page, pageSize)}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">{formatCellDate(record.orderDate)}</td>
                      <td className="px-2 py-3 max-w-xs">{record.description}</td>
                      <td className="px-2 py-3">{record.supplier}</td>
                      <td className="px-2 py-3 whitespace-nowrap">{formatCellDate(record.billDate)}</td>
                      <td className="px-2 py-3 whitespace-nowrap">{formatCellDate(record.deliveryDate)}</td>
                      <td className="px-2 py-3">{record.project}</td>
                      <td className="px-2 py-3">{record.invoiceNumber || '—'}</td>
                      <td className="px-2 py-3 text-right font-medium">{formatCurrency(record.amount)}</td>
                      <td className="px-2 py-3">{record.orderedBy || '—'}</td>
                      <td className="px-2 py-3">
                        <Badge variant={isCompleted ? 'income' : 'expense'}>
                          {record.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">{formatCellDate(record.paymentDate)}</td>
                      {showActions && (
                        <td className="px-2 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {onEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(record)}
                                aria-label={`Edit ${record.description}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(record.id)}
                                aria-label={`Delete ${record.description}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {records.length > 0 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  );
}
