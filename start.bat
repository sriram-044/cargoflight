@echo off
setlocal
echo ==============================================================================
echo CARGOFLIGHT - Airport Operations ^& Baggage Tracking System
echo ==============================================================================

echo [1/3] Ensuring Database Containers are running in Docker...
wsl -d Ubuntu -u root --cd /mnt/e/DBMS/aero docker compose up -d postgres neo4j 2>nul

echo [2/3] Starting Spring Boot Backend in a separate window...
start "CARGOFLIGHT Backend (Port 8080)" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo [3/3] Starting React Frontend in a separate window...
start "CARGOFLIGHT Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 >nul
echo Opening CARGOFLIGHT in your default browser...
start http://localhost:5173

echo ==============================================================================
echo CARGOFLIGHT is running!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo Demo User: admin / Aerotrace@2026
echo ==============================================================================
