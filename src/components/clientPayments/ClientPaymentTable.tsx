import { useMemo } from 'react';
import { getDisplaySerialNumber } from '@/lib/tablePagination';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatCurrency } from '@/lib/currency';
import {
  CLIENT_PAYMENT_BLANK_FILTER,
  getClientPaymentColumnOptions,
} from '@/lib/clientPayment';
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
import type { ClientPaymentColumnFilters, ClientPaymentRecord } from '@/types/clientPayment';

type ClientPaymentTableProps = {
  records: ClientPaymentRecord[];
  optionRecords: ClientPaymentRecord[];
  filters: ClientPaymentColumnFilters;
  onFilterChange: (field: keyof ClientPaymentColumnFilters, value: string) => void;
  onClearFilters: () => void;
  title?: string;
};

type FilterFieldConfig = {
  key: keyof ClientPaymentColumnFilters;
  type: 'select' | 'text';
  placeholder: string;
  align?: 'right';
};

const FILTER_FIELDS: FilterFieldConfig[] = [
  { key: 'sno', type: 'select', placeholder: 'All' },
  { key: 'paymentDate', type: 'select', placeholder: 'All dates' },
  { key: 'description', type: 'select', placeholder: 'All descriptions' },
  { key: 'banking', type: 'text', placeholder: 'Banking', align: 'right' },
  { key: 'cash', type: 'text', placeholder: 'Cash', align: 'right' },
  { key: 'gpay', type: 'text', placeholder: 'GPay', align: 'right' },
  { key: 'amount', type: 'text', placeholder: 'Amount', align: 'right' },
  { key: 'invoiceNumber', type: 'select', placeholder: 'All invoices' },
  { key: 'comment', type: 'select', placeholder: 'All comments' },
];

const ALL_FILTER_VALUE = '__all__';

function formatCellDate(value: string): string {
  return value || '—';
}

function formatAmountCell(value: number): string {
  return value > 0 ? formatCurrency(value) : '—';
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
  if (filter === CLIENT_PAYMENT_BLANK_FILTER) {
    return CLIENT_PAYMENT_BLANK_FILTER;
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
  onFilterChange: (field: keyof ClientPaymentColumnFilters, value: string) => void;
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
          const selectValue = option ? option : CLIENT_PAYMENT_BLANK_FILTER;
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

export function ClientPaymentTable({
  records,
  optionRecords,
  filters,
  onFilterChange,
  onClearFilters,
  title = 'Client payments',
}: ClientPaymentTableProps) {
  const hasActiveFilters = Object.values(filters).some((value) => value.trim().length > 0);

  const { paginatedItems, page, setPage, totalPages, totalItems, pageSize } =
    useTablePagination(records);

  const columnOptions = useMemo(() => {
    const options: Partial<Record<keyof ClientPaymentColumnFilters, string[]>> = {};
    for (const field of FILTER_FIELDS) {
      if (field.type === 'select') {
        options[field.key] = getClientPaymentColumnOptions(optionRecords, field.key);
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
            No payments match your filters for this project.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted font-semibold text-muted-foreground">
                  <th className="px-2 py-3 font-medium">S.No</th>
                  <th className="px-2 py-3 font-medium">Date ↓</th>
                  <th className="px-2 py-3 font-medium">Description</th>
                  <th className="px-2 py-3 font-medium text-right">Banking</th>
                  <th className="px-2 py-3 font-medium text-right">Cash</th>
                  <th className="px-2 py-3 font-medium text-right">GPay</th>
                  <th className="px-2 py-3 font-medium text-right">Amount</th>
                  <th className="px-2 py-3 font-medium">Invoice / Remark</th>
                  <th className="px-2 py-3 font-medium">Comment</th>
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
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((record, rowIndex) => (
                  <tr key={record.id} className="border-b border-border/60">
                    <td className="px-2 py-3">{getDisplaySerialNumber(rowIndex, page, pageSize)}</td>
                    <td className="px-2 py-3 whitespace-nowrap">{formatCellDate(record.paymentDate)}</td>
                    <td className="px-2 py-3 max-w-xs">{record.description}</td>
                    <td className="px-2 py-3 text-right">{formatAmountCell(record.banking)}</td>
                    <td className="px-2 py-3 text-right">{formatAmountCell(record.cash)}</td>
                    <td className="px-2 py-3 text-right">{formatAmountCell(record.gpay)}</td>
                    <td className="px-2 py-3 text-right font-medium text-income">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="px-2 py-3 max-w-xs text-muted-foreground">
                      {record.invoiceNumber || '—'}
                    </td>
                    <td className="px-2 py-3 max-w-xs text-muted-foreground">
                      {record.comment || '—'}
                    </td>
                  </tr>
                ))}
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
