@echo off
title Doruk Dogan - Personal Website Launcher
echo ===================================================
echo   Doruk Dogan - Personal Website & Portfolio Hub
echo ===================================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [INFO] Installing required dependencies...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Please check your Node.js installation.
        pause
        exit /b 1
    )
)

echo [INFO] Starting Astro Development Server...
echo [INFO] Your browser will open automatically once the server is ready.
echo.

call npx.cmd astro dev --open --host

pause
