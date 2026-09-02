@echo off
setlocal enabledelayedexpansion
title Prime Solar Quotation Builder - Launcher

echo ============================================================
echo      PRIME SOLAR QUOTATION BUILDER - LAUNCHER
echo ============================================================
echo.
echo   [1] Open in Web Browser (Quick Desktop Preview)
echo   [2] Run on Android Device / Emulator
echo   [3] Start Expo Metro Server (Scan with Expo Go)
echo   [4] Build Local Standalone Android APK (PrimeSolar-debug.apk)
echo   [5] Build EAS Cloud Android APK
echo.
echo ============================================================

set /p choice="Enter your choice (1-5, default is 1): "
if "%choice%"=="" set choice=1

cd /d "%~dp0"

:: Auto-kill any stale process occupying port 8081
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8081" 2^>nul') do (
    if not "%%a"=="" (
        taskkill /F /PID %%a >nul 2>&1
    )
)

if "%choice%"=="1" (
    echo.
    echo [INFO] Launching Prime Solar in your Web Browser...
    call npx expo start --web
    goto end
)

if "%choice%"=="2" (
    echo.
    echo [INFO] Starting on Android...
    call npx expo start --android
    goto end
)

if "%choice%"=="3" (
    echo.
    echo [INFO] Starting Expo Metro Server...
    call npx expo start --clear
    goto end
)

if "%choice%"=="4" (
    echo.
    call "%~dp0build-apk.bat"
    goto end
)

if "%choice%"=="5" (
    echo.
    echo [INFO] Building Android APK via EAS Build...
    call npx eas-cli build -p android --profile preview
    goto end
)

:end
pause
