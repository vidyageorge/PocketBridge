# Build PocketBridge debug APK (Capacitor + Gradle).
# Requires Java 21+ and Android SDK (Android Studio is the easiest install).
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Building web app for Android (VITE_API_URL from .env.android)..."
npm run build:android

if (-not (Test-Path "android")) {
    Write-Host "Adding Capacitor Android platform..."
    npx cap add android
}

Write-Host "Syncing web assets into Android project..."
npx cap sync android

Write-Host "Compiling debug APK..."
Push-Location android
try {
    if (Test-Path ".\gradlew.bat") {
        .\gradlew.bat assembleDebug
    } else {
        ./gradlew assembleDebug
    }
} finally {
    Pop-Location
}

$apkSource = Join-Path $Root "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = Join-Path $Root "PocketBridge-debug.apk"

if (-not (Test-Path $apkSource)) {
    throw "APK not found at $apkSource"
}

Copy-Item $apkSource $apkDest -Force
Write-Host ""
Write-Host "Done: $apkDest"
