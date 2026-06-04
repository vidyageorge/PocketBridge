/**
 * Run this in the browser console on your PocketBridge tab (e.g. http://localhost:5173)
 * while your data is still in localStorage. It copies a JSON export to the clipboard.
 *
 * Then save to pocketbridge-export.json and run:
 *   node server/scripts/push-store.mjs --api https://pocketbridge.onrender.com --file pocketbridge-export.json
 *
 * Or with Neon DATABASE_URL set locally:
 *   node server/scripts/push-store.mjs --file pocketbridge-export.json
 */
(function exportPocketBridgeLocalStorage() {
  const keys = [
    'pocketbridge_txs',
    'pocketbridge_account_balances',
    'pocketbridge_client_payments',
    'pocketbridge_client_payment_registry',
    'pocketbridge_client_payments_seed_version',
    'pocketbridge_procurement',
    'pocketbridge_supplier_registry',
    'pocketbridge_expenses',
    'pocketbridge_custom_options',
  ];

  const payload = {};
  keys.forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw) {
      payload[key] = JSON.parse(raw);
    }
  });

  const json = JSON.stringify(payload, null, 2);
  const keyCount = Object.keys(payload).length;

  if (keyCount === 0) {
    console.warn('No PocketBridge keys in localStorage on this origin.');
    return;
  }

  if (typeof copy === 'function') {
    copy(json);
    console.log(`Copied ${keyCount} key(s) to clipboard. Save as pocketbridge-export.json`);
  } else {
    console.log(json);
    console.log(`Export ${keyCount} key(s) — copy the JSON above into pocketbridge-export.json`);
  }
})();
