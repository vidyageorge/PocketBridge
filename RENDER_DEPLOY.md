# Fix Render deploy (API)

## Error: `Cannot find module .../index.mjs`

Render is starting from the **repo root**, but the API lives in **`server/`**.

Use **one** of these setups:

### Option A (recommended)

| Setting | Value |
|---------|--------|
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `node index.mjs` |

### Option B (repo root — after pushing latest `index.mjs`)

| Setting | Value |
|---------|--------|
| **Root Directory** | *(leave empty)* |
| **Build Command** | `npm install --prefix server` |
| **Start Command** | `node index.mjs` or `node server/index.mjs` |

Do **not** use `npm run build` (Vite) on the API Web Service — that builds the UI only.

If the build log shows `vite build` and **No open ports detected**, the service is still pointed at the frontend, not the API.

## Environment

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Internal Database URL from Render Postgres |

Link the database under **Connections** or paste the URL manually.

## After saving

1. **Manual Deploy** → Deploy latest commit (must include the `server/` folder on GitHub).
2. Open `https://YOUR-SERVICE.onrender.com/api/health` — expect `"ok": true`.

## Frontend (UI)

`Cannot GET /` on the API URL is normal — the UI is not deployed yet.

**Step-by-step:** [DEPLOY_UI_ON_RENDER.md](./DEPLOY_UI_ON_RENDER.md)

Quick version — add a **Static Site** with `Publish directory` = `dist` and  
`VITE_API_URL` = `https://YOUR-API.onrender.com`.
