# Publish the PocketBridge UI on Render

`https://pocketbridge.onrender.com` is your **API** today. It does not include the React app, so the browser shows `Cannot GET /`.

You can publish the UI in **two ways**.

---

## Option A — Static Site (recommended, two URLs)

Keep the API as-is. Add a **second** Render service for the website.

### Steps

1. Push the latest code to GitHub.
2. In [Render Dashboard](https://dashboard.render.com) → **New +** → **Static Site**.
3. Connect the **PocketBridge** repository.
4. Use these settings:

| Setting | Value |
|---------|--------|
| **Name** | `pocketbridge-web` (any name) |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | *(leave empty — repo root)* |
| **Build Command** | `npm install && npm run build` |
| **Publish directory** | `dist` |

5. **Environment** → add:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://pocketbridge.onrender.com` |

Use your real API URL if the service name is different.

6. Click **Create Static Site** and wait for the deploy to finish.
7. Open the site URL Render gives you, e.g. `https://pocketbridge-web.onrender.com`.

### Result

| URL | Role |
|-----|------|
| `https://pocketbridge.onrender.com` | API only (`/api/health`, …) |
| `https://pocketbridge-web.onrender.com` | **PocketBridge app (UI)** |

Bookmark the **Static Site** URL for daily use in the browser.

### Redeploy after code changes

Push to GitHub → Render rebuilds the Static Site automatically (or **Manual Deploy**).

---

## Option B — One URL (API + UI on `pocketbridge.onrender.com`)

Serve the built UI from the same Web Service as the API (requires code that serves `dist/` — included in `server/index.mjs`).

### Change your existing Web Service settings

| Setting | Value |
|---------|--------|
| **Root Directory** | *(empty — repo root)* |
| **Build Command** | `npm install && npm run build && npm install --prefix server` |
| **Start Command** | `node server/index.mjs` |

Keep `DATABASE_URL` as it is now.

You do **not** need `VITE_API_URL` for this option: the UI and API share the same origin, so the app calls `/api/...` on the same host.

### After deploy

| URL | What you see |
|-----|----------------|
| `https://pocketbridge.onrender.com/` | PocketBridge app |
| `https://pocketbridge.onrender.com/api/health` | API JSON |

Push the latest repo to GitHub, then **Manual Deploy** on the Web Service.

---

## Which option to pick?

| | Option A (Static Site) | Option B (one URL) |
|--|------------------------|---------------------|
| Setup | New service, simple | Change existing API service |
| URLs | Two (API + web) | One |
| Risk | Low | Must fix build/start commands carefully |

---

## Verify

**UI:** Dashboard, Bank, Cash tabs load with data.

**API:** `https://pocketbridge.onrender.com/api/health` → `"ok": true`

---

## Local development (unchanged)

```powershell
npm run dev:server   # Terminal 1
npm run dev          # Terminal 2
```

Open http://localhost:5173 — see [LOCAL_SETUP.md](./LOCAL_SETUP.md).
