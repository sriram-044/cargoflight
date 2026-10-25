@echo off
setlocal
echo ==============================================================================
echo FLYTRACK - Starting Vite React Frontend Dev Server (Port 5173)
echo ==============================================================================
cd /d "%~dp0"
call npm run dev
