@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
echo Using PROJECT_ROOT: %PROJECT_ROOT%

if not exist "%PROJECT_ROOT%package.json" (
    echo ERROR: package.json not found under PROJECT_ROOT.
    echo Expected: %PROJECT_ROOT%package.json
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%scripts\chatgpt-catalog-pilot.mjs" (
    echo ERROR: Pilot script not found under PROJECT_ROOT.
    echo Expected: %PROJECT_ROOT%scripts\chatgpt-catalog-pilot.mjs
    pause
    exit /b 1
)

pushd "%PROJECT_ROOT%" >nul

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 goto :npm_install_error
) else (
    echo Dependencies already installed.
)

echo.
echo ===============================================
echo ChatGPT Catalog Pilot Launcher
echo ===============================================
echo 1^) Preflight only
echo 2^) Run pilot generation
echo 3^) Preflight then run generation
echo.
set /p "CHOICE=Select an option (1-3): "

if "%CHOICE%"=="1" goto :run_preflight_only
if "%CHOICE%"=="2" goto :run_pilot_only
if "%CHOICE%"=="3" goto :run_both

echo Invalid selection: "%CHOICE%"
echo Please run again and choose 1, 2, or 3.
goto :done_error

:run_preflight_only
echo.
echo Running preflight...
call npm run catalog:pilot:chatgpt:preflight
if errorlevel 1 (
    echo Preflight failed.
    goto :done_error
)
echo Preflight completed successfully.
goto :done_ok

:run_pilot_only
echo.
echo Running pilot generation...
call npm run catalog:pilot:chatgpt
if errorlevel 1 (
    echo Pilot generation failed.
    goto :done_error
)
echo Pilot generation completed successfully.
goto :done_ok

:run_both
echo.
echo Running preflight...
call npm run catalog:pilot:chatgpt:preflight
if errorlevel 1 (
    echo Preflight failed.
    goto :done_error
)
echo Preflight completed successfully.
echo.
echo Running pilot generation...
call npm run catalog:pilot:chatgpt
if errorlevel 1 (
    echo Pilot generation failed.
    goto :done_error
)
echo Pilot generation completed successfully.
goto :done_ok

:npm_install_error
echo Failed to install dependencies.
goto :done_error

:done_ok
popd >nul
pause
exit /b 0

:done_error
popd >nul
pause
exit /b 1
