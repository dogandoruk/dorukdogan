@echo off
title Doruk Dogan - Studio CMS Server
echo ===================================================
echo   Doruk Dogan - Studio CMS Control Panel
echo ===================================================
echo.

cd /d "%~dp0"

echo [INFO] Launching Studio CMS at http://localhost:3001 ...
echo [INFO] Opening default browser...
echo.

start "" http://localhost:3001
node cms/server.mjs

pause
