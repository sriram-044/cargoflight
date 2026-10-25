@echo off
setlocal enabledelayedexpansion
title FLYTRACK Terminator
echo ==============================================================================
echo   FLYTRACK - Stopping Airport Baggage Tracking and Flight Management System
echo   "Your baggage journey, made simple."
echo ==============================================================================
echo.

set "STOPPED_BACKEND=0"
echo [1/2] Terminating Spring Boot Backend (Port 8080)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    echo   - Stopping Backend process on PID %%a...
    taskkill /f /t /pid %%a >nul 2>&1
    set "STOPPED_BACKEND=1"
)
if "!STOPPED_BACKEND!"=="0" (
    echo   - Backend is not running on port 8080.
) else (
    echo   - Backend on port 8080 stopped successfully.
)

echo.
set "STOPPED_FRONTEND=0"
echo [2/2] Terminating Vite React Frontend (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo   - Stopping Frontend dev server on PID %%a...
    taskkill /f /t /pid %%a >nul 2>&1
    set "STOPPED_FRONTEND=1"
)
if "!STOPPED_FRONTEND!"=="0" (
    echo   - Frontend dev server is not running on port 5173.
) else (
    echo   - Frontend dev server on port 5173 stopped successfully.
)

echo.
echo ==============================================================================
echo   FLYTRACK services have been shut down cleanly.
echo ==============================================================================
echo.
timeout /t 2 >nul
