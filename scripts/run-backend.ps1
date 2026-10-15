# PowerShell helper to start CARGOFLIGHT Spring Boot backend
Write-Host "Starting CARGOFLIGHT Spring Boot Backend..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\backend"
mvn spring-boot:run
