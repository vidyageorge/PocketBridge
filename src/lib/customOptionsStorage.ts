import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { CustomOptionsData } from '@/types/customOptions';
import { EMPTY_CUSTOM_OPTIONS } from '@/types/customOptions';

export function loadCustomOptions(): CustomOptionsData {
  const stored = getCachedStoreValue<CustomOptionsData | null>(
    STORE_KEYS.CUSTOM_OPTIONS,
    null,
  );
  return stored ?? { ...EMPTY_CUSTOM_OPTIONS };
}

export function saveCustomOptions(data: CustomOptionsData): void {
  setCachedStoreValue(STORE_KEYS.CUSTOM_OPTIONS, data);
}
