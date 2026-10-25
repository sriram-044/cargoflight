@echo off
setlocal
echo ==============================================================================
echo FLYTRACK - Smart Airport Baggage Tracking and Flight Management System
echo "Your baggage journey, made simple."
echo ==============================================================================

echo [1/3] Ensuring Database Containers are running in Docker...
wsl -d Ubuntu -u root --cd /mnt/e/DBMS/aero docker compose up -d postgres neo4j 2>nul

echo [2/3] Starting Spring Boot Backend in a separate window...
start "FLYTRACK Backend (Port 8080)" cmd /k "cd /d %~dp0backend && call run.bat"

echo [3/3] Starting React Frontend in a separate window...
start "FLYTRACK Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && call run.bat"

timeout /t 5 >nul
echo Opening FlyTrack in your default browser...
start http://localhost:5173

echo ==============================================================================
echo FLYTRACK is running!
echo "Your baggage journey, made simple."
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo Demo User: admin / Aerotrace@2026
echo ==============================================================================
