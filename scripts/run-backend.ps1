# PowerShell helper to start CARGOFLIGHT Spring Boot backend
$envFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '^\s*([^#=]+)=(.*)$' } | ForEach-Object {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

Write-Host "Starting CARGOFLIGHT Spring Boot Backend..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\backend"
mvn spring-boot:run
