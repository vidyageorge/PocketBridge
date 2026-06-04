import { getCachedStoreValue, setCachedStoreValue } from '@/lib/dataBackend';
import { STORE_KEYS } from '@/lib/storeKeys';
import type { ClientPaymentRegistry } from '@/types/clientPayment';
import { EMPTY_CLIENT_PAYMENT_REGISTRY } from '@/types/clientPayment';

export const CLIENT_PAYMENT_REGISTRY_STORAGE_KEY = STORE_KEYS.CLIENT_PAYMENT_REGISTRY;

export function loadClientPaymentRegistry(): ClientPaymentRegistry {
  const parsed = getCachedStoreValue<ClientPaymentRegistry | null>(
    STORE_KEYS.CLIENT_PAYMENT_REGISTRY,
    null,
  );

  if (!parsed || typeof parsed !== 'object') {
    return { ...EMPTY_CLIENT_PAYMENT_REGISTRY };
  }

  return {
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    clientNames: Array.isArray(parsed.clientNames) ? parsed.clientNames : [],
  };
}

export function saveClientPaymentRegistry(registry: ClientPaymentRegistry): void {
  setCachedStoreValue(STORE_KEYS.CLIENT_PAYMENT_REGISTRY, registry);
}
