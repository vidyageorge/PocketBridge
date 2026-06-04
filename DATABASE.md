# PocketBridge database

PocketBridge can save all app data in a **SQLite** file on your computer instead of only the browser.

## Database file location

```
server/data/pocketbridge.db
```

Back up this file to keep your bank, cash, procurement, and client payment data safe.

## Run with the database

**Terminal 1 — API server**

```bash
npm run setup:server
npm run dev:server
```

**Terminal 2 — web app**

```bash
npm run dev
```

Open http://localhost:5173. You should see a banner: **Saving to SQLite database on this computer**.

## How it works

- The React app talks to `http://localhost:3001` (proxied as `/api` in dev).
- Data is stored as JSON in SQLite table `app_store` (same keys as before in `localStorage`).
- On first connect, if the database is empty, existing **browser `localStorage`** is copied into SQLite automatically.

## Without the server

If the API is not running, the app falls back to **browser `localStorage`** (previous behaviour).

## Link Render PostgreSQL

You need **two** things on Render: the **Postgres** database (your screenshot) and a **Web Service** for the API.

### 1. Create Postgres on Render

- **Name:** `PocketBridge` (or `pocketbridge`)
- **Database:** `pocketbridge` (optional but clearer)
- **User:** `pocketbridge` (optional)
- **Region:** same region you will use for the API (e.g. Oregon)
- Click **Create Database** and wait until status is **Available**

### 2. Deploy the API (Web Service)

1. Push this repo to GitHub.
2. On Render: **New → Web Service** → connect the repo.
3. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.mjs`
4. **Environment** → add variable:
   - Key: `DATABASE_URL`
   - Value: copy **Internal Database URL** from the Postgres page  
     (starts with `postgresql://...`)
5. **Create Web Service**

Render injects `DATABASE_URL` automatically if you use **Blueprint** (`render.yaml`) or link the DB under **Connections** on the web service.

When `DATABASE_URL` is set, the API uses **PostgreSQL**. Without it, local dev uses **SQLite**.

### 3. Link the React app to the API

**Local dev pointing at Render:**

Create `.env.local` in the project root:

```env
VITE_API_URL=https://pocketbridge-api.onrender.com
```

(Use your real Web Service URL from Render.)

Run `npm run dev`. The app will load/save via Render Postgres.

**Production static site** (Render Static Site or similar):

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://your-api.onrender.com`

### 4. First-time data

On first connect to an empty Postgres DB, the app copies data from **browser localStorage** into Render (same as local SQLite migration).

### 5. Verify

Open:

`https://your-api.onrender.com/api/health`

You should see:

```json
{ "ok": true, "database": "postgres:render", "empty": true }
```

(`empty: false` after you have used the app.)

## Push localStorage (or SQLite) to Neon

Neon only receives data when the **API** writes to it. Set Render’s `DATABASE_URL` to your **Neon connection string** (Neon dashboard → Connect), then use one of these:

### Option A — From the browser (easiest)

1. On your machine, create `.env.local` in the project root:
   ```env
   VITE_API_URL=https://pocketbridge.onrender.com
   ```
2. Run `npm run dev` and open http://localhost:5173 (same browser where your data already lives).
3. On first load, if the DB is empty, data copies automatically.
4. Or click **Upload browser data to database** in the top banner (after the API connects).
5. Check health again — `"empty": false`. In Neon → **Tables** → `app_store`, you should see rows.

### Option B — Export JSON + API

1. On the tab that has your data, open DevTools → Console.
2. Paste and run `scripts/browser-export-localStorage.js` (or copy its contents).
3. Save the clipboard as `pocketbridge-export.json` in the project root.
4. Run:
   ```bash
   node server/scripts/push-store.mjs --api https://pocketbridge.onrender.com --file pocketbridge-export.json
   ```

### Option C — Direct to Neon (no Render in the middle)

1. Copy Neon’s connection string.
2. In PowerShell:
   ```powershell
   $env:DATABASE_URL="postgresql://..."
   npm run push:store
   ```
   Uses `server/data/pocketbridge.db` if you have been saving locally with the API.

   Or from the JSON export:
   ```bash
   node server/scripts/push-store.mjs --file pocketbridge-export.json
   ```

In Neon SQL Editor:

```sql
SELECT key, updated_at FROM app_store;
```

## Production (summary)

| Piece | Render type |
|--------|-------------|
| Postgres | Database (you are creating this) |
| API | Web Service (`server/`, needs `DATABASE_URL`) |
| UI | Static Site (`dist/`, needs `VITE_API_URL`) |
