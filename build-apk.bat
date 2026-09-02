@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   Prime Solar Quotation Builder - Android APK Build Script
echo ============================================================

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

if exist "%LOCALAPPDATA%\Android\Sdk" (
    set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    echo [INFO] Detected Android SDK at: !ANDROID_HOME!
)

if not defined JAVA_HOME (
    if exist "C:\Program Files\Android\Android Studio\jbr" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
        set "PATH=%JAVA_HOME%\bin;%PATH%"
        echo [INFO] Detected Java at: !JAVA_HOME!
    )
)

echo [STEP 1/3] Prebuilding Native Android Project via Expo CLI...
call npx expo prebuild --platform android --no-install
if %errorlevel% neq 0 (
    echo [ERROR] Expo prebuild failed!
    pause
    exit /b %errorlevel%
)

if exist "%PROJECT_DIR%android" (
    echo sdk.dir=!ANDROID_HOME:\=\\!> "%PROJECT_DIR%android\local.properties"
)

echo [STEP 2/3] Building Android Debug APK with Gradle...
cd android
call gradlew assembleDebug --no-daemon
if %errorlevel% neq 0 (
    echo [ERROR] Gradle APK compilation failed!
    cd ..
    pause
    exit /b %errorlevel%
)

cd ..

set "OUTPUT_APK=%PROJECT_DIR%android\app\build\outputs\apk\debug\app-debug.apk"
set "FINAL_APK=%PROJECT_DIR%PrimeSolar-debug.apk"

if exist "%OUTPUT_APK%" (
    copy /y "%OUTPUT_APK%" "%FINAL_APK%" >nul
    echo.
    echo ============================================================
    echo   [SUCCESS] Prime Solar APK compiled successfully!
    echo   File: %FINAL_APK%
    echo ============================================================
) else (
    echo [ERROR] Could not find compiled APK at: %OUTPUT_APK%
)

pause
