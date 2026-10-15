# PowerShell helper to start CARGOFLIGHT React frontend
Write-Host "Starting CARGOFLIGHT React Frontend (Vite)..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}
npm run dev
