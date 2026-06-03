import clientPaymentSeed from '@/data/client-payment-seed.json';
import type { ClientPaymentRecord } from '@/types/clientPayment';

export const CLIENT_PAYMENT_STORAGE_KEY = 'pocketbridge_client_payments';

export function loadClientPaymentRecords(): ClientPaymentRecord[] {
  try {
    const stored = localStorage.getItem(CLIENT_PAYMENT_STORAGE_KEY);
    if (!stored) {
      return seedClientPaymentRecords();
    }

    const parsed = JSON.parse(stored) as ClientPaymentRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return seedClientPaymentRecords();
    }

    return parsed;
  } catch {
    return seedClientPaymentRecords();
  }
}

export function saveClientPaymentRecords(records: ClientPaymentRecord[]): void {
  localStorage.setItem(CLIENT_PAYMENT_STORAGE_KEY, JSON.stringify(records));
}

export function seedClientPaymentRecords(): ClientPaymentRecord[] {
  const seeded = clientPaymentSeed as ClientPaymentRecord[];
  saveClientPaymentRecords(seeded);
  return seeded;
}
