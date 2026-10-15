# PowerShell helper to start CARGOFLIGHT Spring Boot backend with dedicated MongoDB Atlas
param (
    [string]$AtlasUri = $env:SPRING_DATA_MONGODB_URI
)

if (-not $AtlasUri) {
    Write-Host "MongoDB Atlas connection string not found in `$env:SPRING_DATA_MONGODB_URI." -ForegroundColor Yellow
    $AtlasUri = Read-Host "Please enter your CARGOFLIGHT Atlas connection URI (mongodb+srv://cargoflight_app:...)"
}

if (-not $AtlasUri) {
    Write-Host "No Atlas URI provided. Exiting." -ForegroundColor Red
    exit 1
}

$env:SPRING_DATA_MONGODB_URI = $AtlasUri
$env:SPRING_PROFILES_ACTIVE = "atlas"

Write-Host "Starting CARGOFLIGHT Spring Boot Backend connected to dedicated MongoDB Atlas..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\backend"
mvn spring-boot:run
