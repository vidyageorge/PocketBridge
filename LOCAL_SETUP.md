# PocketBridge — run locally and populate data

This guide is for **daily use on your computer**. It keeps data on your PC (SQLite file), not in the cloud.

For cloud deploy (Render / Neon), see [DATABASE.md](./DATABASE.md) and [RENDER_DEPLOY.md](./RENDER_DEPLOY.md).

---

## What you need

| Requirement | Notes |
|-------------|--------|
| **Node.js** | Version 18 or newer (22 works) |
| **This repo** | `c:\Users\vidya.g\Documents\GitHub\PocketBridge` |
| **Two terminals** | One for the API, one for the web UI (recommended) |

---

## One-time setup

Open PowerShell in the project folder:

```powershell
cd c:\Users\vidya.g\Documents\GitHub\PocketBridge
npm install
npm run setup:server
```

---

## Run the app every day (recommended)

Use **local SQLite** so bank, cash, procurement, and client data stay in one file on disk.

### Step 1 — Do not point at the cloud for local work

For local-only storage, **do not** use a `.env.local` file with `VITE_API_URL`, or remove that file if it exists.

If `VITE_API_URL` is set, the app loads from Render and you may see **empty Bank/Cash** even when your PC has data.

### Step 2 — Start the API (Terminal 1)

```powershell
cd c:\Users\vidya.g\Documents\GitHub\PocketBridge
npm run dev:server
```

Wait until you see:

```text
PocketBridge API listening on http://localhost:3001
SQLite database: ...\server\data\pocketbridge.db
```

Leave this terminal open.

### Step 3 — Start the web app (Terminal 2)

```powershell
cd c:\Users\vidya.g\Documents\GitHub\PocketBridge
npm run dev
```

Open **http://localhost:5173**

You should see **“Saving to local database (SQLite on this computer)”** at the top. Data is stored in:

```text
server/data/pocketbridge.db
```

### Step 4 — First visit only (copy browser data into SQLite)

If you already used PocketBridge in this browser before the API was running:

1. Open the app once with **both** terminals running.
2. If the SQLite file was empty, existing **browser localStorage** is copied into `pocketbridge.db` automatically.
3. Refresh the page and check Bank / Cash tabs.

---

## How to populate data (by section)

### Bank Account

1. Go to **Bank Account**.
2. Use **Choose Statement File** or drag an **ICICI CSV or PDF** onto the import area.
3. After import, use **Month** / **Year** filters to view a period.
4. Bank rows are read-only in the table (no edit/delete on statement lines).

### Cash Account

1. Go to **Cash Account**.
2. Use **Add Cash Transaction**:
   - **Payment (from client)** — cash received from a client.
   - **Expense** — petty cash spent (add **Spent by** if needed).
3. Optional: **Load cash from client payments** pulls cash amounts from the client payment workbook (testing/import helper).

### Combined Statement

- Shows bank + cash together for the selected month/year.
- **Export to Excel** exports the combined view for that filter.

### Procurement and Suppliers

1. **Procurement** — import the procurement Excel workbook, or add orders with the form.
2. **Suppliers** — pick a supplier to see their orders; use **Edit** / **Delete** on rows (with confirmation).

### Projects & Client

1. Import the **Client - Projects Payment** workbook, or add projects/clients/payments manually.
2. Use project tabs (P-01, P-02, …) and client views.

### Expense

1. Import the **01-Summary** expense workbook, or add lines in **Project Expense** / **Employee Expense**.

---

## Keep your data safe

| What | Where |
|------|--------|
| Main database file | `server/data/pocketbridge.db` |
| Browser copy (fallback) | `localStorage` keys starting with `pocketbridge_` |

**Back up** `pocketbridge.db` regularly (copy the file to OneDrive/USB). Restoring is: stop the API, replace the file, start again.

---

## Quick checklist

| Step | Done? |
|------|--------|
| `npm install` and `npm run setup:server` once | |
| No `VITE_API_URL` in `.env.local` for local work | |
| Terminal 1: `npm run dev:server` running | |
| Terminal 2: `npm run dev` running | |
| Open http://localhost:5173 | |
| Import or add data in each tab you need | |
| Back up `server/data/pocketbridge.db` | |

---

## If you see no data

| Symptom | What to do |
|---------|------------|
| **Bank Statement (0 entries)** | Import a statement, or check Month/Year filter. |
| **Cash ledger (0 entries)** | Add cash lines, or check filters. |
| Data was on cloud but empty locally | Remove `.env.local`, restart `npm run dev`, use local API only. |
| Had data in browser only | Run API + app once to migrate; or restore from `pocketbridge.db` backup. |
| API terminal not running | App may use localStorage only; start `npm run dev:server` for SQLite. |

### Restore local DB to the cloud (only if you use Render later)

If you later enable `VITE_API_URL` and the cloud is missing bank/cash:

```powershell
node server/scripts/push-store.mjs --api https://pocketbridge.onrender.com
```

That uploads everything from `server/data/pocketbridge.db` to the API.

---

## Optional: local UI only (no API)

Single terminal:

```powershell
npm run dev
```

- Data stays in the **browser** only (`localStorage`).
- No `pocketbridge.db` file updates.
- Fine for a quick try; **not recommended** for real work.

---

## Stop the app

1. Press **Ctrl+C** in the `npm run dev` terminal.
2. Press **Ctrl+C** in the `npm run dev:server` terminal.

---

## Build for production (optional)

```powershell
npm run build
```

Output is in `dist/`. Local development normally uses `npm run dev` only.
