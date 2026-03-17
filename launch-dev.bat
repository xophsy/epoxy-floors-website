@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
pushd "%PROJECT_ROOT%" >nul

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 goto :error
) else (
    echo Dependencies already installed.
)

if exist ".next\" (
    echo Clearing build cache...
    rmdir /s /q ".next"
)

echo Starting Next.js dev server...
start "Next.js Dev Server" /D "%PROJECT_ROOT%" cmd /k npm run dev

echo Waiting for server to be ready (this may take 30-60 seconds)...
:wait_loop
timeout /t 3 /nobreak >nul
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto :wait_loop

echo Server is ready. Opening browser...
start "" "http://localhost:3000"

popd >nul
exit /b 0

:error
echo Failed to install dependencies.
popd >nul
pause
exit /b 1
