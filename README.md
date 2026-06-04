# PocketBridge

**One view for your bank and cash.**

PocketBridge is a personal finance tracker that combines your bank (online/UPI) and cash transactions into one unified dashboard.

## Tech Stack

- React + TypeScript
- Tailwind CSS
- shadcn/ui-style components
- localStorage for persistence
- SheetJS (xlsx) for Excel export/import
- Recharts for dashboard charts

## Features

- **Dashboard**  Summary metrics, expense charts, bank vs cash split, combined transaction table
- **Bank Account**  Bank statement import, filtering, delete, Excel export
- **Cash Account**  Manual entry, filtering, delete, Excel export
- **Combined Statement**  Bank and cash entries in one date-wise ledger

## Getting Started

**Full local guide (run app + populate data):** [LOCAL_SETUP.md](./LOCAL_SETUP.md)  
**Publish UI on Render:** [DEPLOY_UI_ON_RENDER.md](./DEPLOY_UI_ON_RENDER.md)

Quick start:

```bash
npm install
npm run setup:server
```

**Terminal 1:** `npm run dev:server`  
**Terminal 2:** `npm run dev`

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

## Data Storage

With the local API running, data is saved to `server/data/pocketbridge.db`. Without the API, the app uses browser `localStorage`. See [LOCAL_SETUP.md](./LOCAL_SETUP.md) and [DATABASE.md](./DATABASE.md).

## License

MIT