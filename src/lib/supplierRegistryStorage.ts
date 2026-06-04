import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { SupplierRegistry } from '@/types/procurement';
import { EMPTY_SUPPLIER_REGISTRY } from '@/types/procurement';

export const SUPPLIER_REGISTRY_STORAGE_KEY = STORE_KEYS.SUPPLIER_REGISTRY;

export function loadSupplierRegistry(): SupplierRegistry {
  const parsed = getCachedStoreValue<SupplierRegistry | null>(
    STORE_KEYS.SUPPLIER_REGISTRY,
    null,
  );

  if (!parsed || typeof parsed !== 'object') {
    return { ...EMPTY_SUPPLIER_REGISTRY };
  }

  return {
    supplierNames: Array.isArray(parsed.supplierNames) ? parsed.supplierNames : [],
  };
}

export function saveSupplierRegistry(registry: SupplierRegistry): void {
  setCachedStoreValue(STORE_KEYS.SUPPLIER_REGISTRY, registry);
}
