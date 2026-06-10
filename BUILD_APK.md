# PocketBridge — Android APK

PocketBridge is **not** a native Android app. The APK is your existing React UI in a WebView (via [Capacitor](https://capacitorjs.com/)), talking to the same API on Render.

## How it fits together

| Layer | What it is | Where it lives |
|-------|------------|----------------|
| Source code | React + Node app | GitHub repo |
| Live API | Express + Postgres | `https://pocketbridge.onrender.com` |
| Android app | Web UI in WebView | APK on your phone |
| APK backend | Same API as cloud | `https://pocketbridge.onrender.com/api/...` |

The APK does **not** bundle the Node server. It is a thin shell that loads the built React app and calls Render over the network.

## What was added for Android

| Piece | Purpose |
|-------|---------|
| `@capacitor/core`, `@capacitor/android` | Wraps the built web app as an Android project |
| `capacitor.config.ts` | App id `com.sixtycubits.pocketbridge`, `webDir: 'dist'` |
| `.env.android` | `VITE_API_URL=https://pocketbridge.onrender.com` for mobile builds |
| `vite.config.ts` | `base: './'` so assets load inside the APK |
| `scripts/build-android-apk.ps1` | Local build script (Windows) |
| `npm run build:apk` | Runs that script from the repo root |
| `.github/workflows/build-android-apk.yml` | Cloud APK build on GitHub Actions |

## Build pipeline

1. **Build web client** — `npm run build:android` (Vite → `dist/`, uses `.env.android`)
2. **Sync to Android** — `npx cap sync android` (copies `dist/` into the Android project)
3. **Compile APK** — Gradle `assembleDebug` → `app-debug.apk`

## Two ways to get the APK

### A. GitHub Actions (no Android Studio on your PC)

1. Push to `main` (when `src/`, config, or workflow files change), **or**
2. GitHub → **Actions** → **Build Android APK** → **Run workflow**
3. Open the latest run → **Artifacts** → download **PocketBridge-debug-apk**
4. Install on your phone (`adb install` or sideload the APK)

### B. On your PC (`npm run build:apk`)

Requires **Java 21+** and the **Android SDK** (install via [Android Studio](https://developer.android.com/studio)).

```powershell
npm run build:apk
```

Output: `PocketBridge-debug.apk` in the project root.

## Deploy / update the web API

```powershell
git add .
git commit -m "Your message"
git push origin main
```

Render redeploys the API from GitHub. The APK always uses the hosted API URL in `.env.android` — push a new APK only when the **UI** changes, not when only server code changes.

## Local development (unchanged)

```powershell
npm run dev:server   # Terminal 1
npm run dev          # Terminal 2
```

Open http://localhost:5173 — see [LOCAL_SETUP.md](./LOCAL_SETUP.md). Do **not** set `VITE_API_URL` in `.env.local` for normal local work.

## Quick reference

| Task | Command / action |
|------|------------------|
| Fresh APK (cloud) | GitHub Actions → Build Android APK |
| Fresh APK (local SDK) | `npm run build:apk` |
| Update API on Render | `git push origin main` |
| Change API URL in APK | Edit `.env.android`, rebuild APK |
