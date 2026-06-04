# PocketBridge — Tech Stack

## Frontend

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **UI components** | shadcn/ui-style (Radix UI primitives + `class-variance-authority`, `clsx`, `tailwind-merge`) |
| **Icons** | Lucide React |
| **Charts** | Recharts |

## Data & files

| Layer | Technology |
|---|---|
| **Persistence** | SQLite via local API (`server/data/pocketbridge.db`), with `localStorage` fallback |
| **Excel read/write** | SheetJS (`xlsx`) — bank statement import & export |
| **Backend** | Node + Express + `better-sqlite3` (optional; see `DATABASE.md`) |

## Tooling

- **ESLint** — linting
- **TypeScript** — type checking

## Architecture

Single-page app (SPA) → React Context for transactions → no server, no database.

## Commands

```bash
npm run setup:server   # install API dependencies (once)
npm run dev:server     # SQLite API on http://localhost:3001
npm run dev            # web app (http://localhost:5173)
npm run build          # production build → dist/
npm run preview        # preview production build
```

## Key dependencies

- `react`, `react-dom`
- `vite`, `@vitejs/plugin-react`
- `tailwindcss`, `@tailwindcss/vite`
- `@radix-ui/react-tabs`, `@radix-ui/react-select`, `@radix-ui/react-label`, `@radix-ui/react-slot`
- `recharts`
- `xlsx`
- `lucide-react`
- `class-variance-authority`, `clsx`, `tailwind-merge`
