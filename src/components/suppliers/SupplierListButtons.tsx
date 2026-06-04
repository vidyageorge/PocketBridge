import { getSupplierList } from '@/lib/procurement';
import { useProcurement } from '@/context/ProcurementContext';
import { cn } from '@/lib/utils';

type SupplierListButtonsProps = {
  selectedSupplier: string;
  onSupplierChange: (supplierName: string) => void;
};

/**
 * Supplier picker buttons built from procurement orders and manual registry.
 */
export function SupplierListButtons({
  selectedSupplier,
  onSupplierChange,
}: SupplierListButtonsProps) {
  const { records, supplierRegistry } = useProcurement();
  const suppliers = getSupplierList(records, supplierRegistry);

  if (suppliers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a supplier below or upload the procurement workbook.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {suppliers.map((supplier) => {
        const isActive = selectedSupplier === supplier.supplierName;
        return (
          <button
            key={supplier.supplierName}
            type="button"
            onClick={() => onSupplierChange(supplier.supplierName)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
              'bg-nav-yellow text-nav-yellow-foreground hover:brightness-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-navy',
              isActive && 'bg-nav-navy text-nav-navy-foreground shadow-sm hover:brightness-100',
            )}
          >
            {supplier.supplierName}
          </button>
        );
      })}
    </div>
  );
}
