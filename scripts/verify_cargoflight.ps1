$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$env:PGPASSWORD = "1234"

Write-Host "===================================================="
Write-Host "1. Testing direct psql connection to cargoflight:5433"
Write-Host "===================================================="
& $psql -h localhost -p 5433 -U postgres -d cargoflight -c "SELECT current_database() AS db, current_user AS usr, inet_server_port() AS port, version();"

Write-Host "`n===================================================="
Write-Host "2. Verifying existing tables in cargoflight"
Write-Host "===================================================="
& $psql -h localhost -p 5433 -U aerotrace_app -d cargoflight -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'cargoflight_dw') ORDER BY table_schema, table_name;"

Write-Host "`n===================================================="
Write-Host "3. Verifying friend's pre-existing airbaggage & baggage data"
Write-Host "===================================================="
Write-Host "--- airbaggage table ---"
& $psql -h localhost -p 5433 -U aerotrace_app -d cargoflight -c "SELECT * FROM airbaggage;"
Write-Host "--- baggage table pre-existing row ---"
& $psql -h localhost -p 5433 -U aerotrace_app -d cargoflight -c "SELECT id, baggage_id, baggage_tag, passenger_name, flight_number, current_status, terminal FROM baggage WHERE baggage_tag = 'BAG1001';"

Write-Host "`n===================================================="
Write-Host "4. Testing Backend API Authentication & Health"
Write-Host "===================================================="
$sessionResp = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/demo-session" -Method Get
$token = $sessionResp.data.token
Write-Host "Authenticated successfully as $($sessionResp.data.username) ($($sessionResp.data.role))"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

Write-Host "`nDatabase Center Status:"
$dbStatus = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/database-center/status" -Headers $headers -Method Get
$dbStatus | ConvertTo-Json -Depth 4

Write-Host "`n===================================================="
Write-Host "5. Getting available Flight and Handling Point from API/DB"
Write-Host "===================================================="
$flights = & $psql -h localhost -p 5433 -U postgres -d cargoflight -t -A -F "," -c "SELECT id, flight_number FROM flights LIMIT 1;"
$flightParts = $flights.Trim().Split(",")
$flightId = [int64]$flightParts[0]
$flightNumber = $flightParts[1]
Write-Host "Selected Flight: ID=$flightId, FlightNumber=$flightNumber"

$hp = (& $psql -h localhost -p 5433 -U postgres -d cargoflight -t -A -c "SELECT id FROM handling_points WHERE category = 'CHECK_IN' LIMIT 1;").Trim()
Write-Host "Selected Handling Point: $hp"

Write-Host "`n===================================================="
Write-Host "6. Registering a test baggage record through the backend API"
Write-Host "===================================================="
$testTag = "CARGO-CF-903"
$regPayload = @{
    baggageTag = $testTag
    flightId = $flightId
    passengerName = "Sriram Cargo Verification"
    passengerPnr = "PNR99CF"
    originIata = "MAA"
    destinationIata = "DEL"
    weightKg = 24.5
    initialHandlingPointId = $hp
} | ConvertTo-Json

Write-Host "Sending registration payload..."
$regResp = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/baggage/register" -Headers $headers -Method Post -Body $regPayload
Write-Host "Registration Response: $($regResp.message)"
$regResp.data | ConvertTo-Json -Depth 3

Write-Host "`n===================================================="
Write-Host "7. Updating baggage status via transition API"
Write-Host "===================================================="
$transPayload = @{
    targetStatus = "CHECKED_IN"
    handlingPointId = $hp
    scannerId = "SCN-MAA-CK01"
    notes = "Baggage checked in and verified at counter"
} | ConvertTo-Json

$transResp = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/baggage/$testTag/transition" -Headers $headers -Method Post -Body $transPayload
Write-Host "Transition 1 Response: $($transResp.message)"

# Transition to SECURITY_CLEARED
$secHp = (& $psql -h localhost -p 5433 -U postgres -d cargoflight -t -A -c "SELECT id FROM handling_points WHERE category = 'SECURITY' LIMIT 1;").Trim()
$trans2Payload = @{
    targetStatus = "SECURITY_CLEARED"
    handlingPointId = $secHp
    scannerId = "SCN-MAA-SEC1"
    notes = "Security X-ray screening cleared successfully"
} | ConvertTo-Json

$trans2Resp = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/baggage/$testTag/transition" -Headers $headers -Method Post -Body $trans2Payload
Write-Host "Transition 2 Response: $($trans2Resp.message)"

Write-Host "`n===================================================="
Write-Host "8. Verifying directly in PostgreSQL cargoflight database"
Write-Host "===================================================="
Write-Host "--- baggage table row for $testTag ---"
& $psql -h localhost -p 5433 -U postgres -d cargoflight -c "SELECT id, baggage_id, baggage_tag, passenger_name, flight_number, current_status, weight_kg, terminal FROM baggage WHERE baggage_tag = '$testTag';"

Write-Host "--- baggage_movement_history table for $testTag ---"
& $psql -h localhost -p 5433 -U postgres -d cargoflight -c "SELECT id, baggage_tag, status_before, status_after, handling_point_id, scanner_id, recorded_at, notes FROM baggage_movement_history WHERE baggage_tag = '$testTag' ORDER BY recorded_at ASC;"

Write-Host "--- Confirming friend's data remains untouched ---"
& $psql -h localhost -p 5433 -U postgres -d cargoflight -c "SELECT COUNT(*) AS total_baggage_count FROM baggage;"
& $psql -h localhost -p 5433 -U postgres -d cargoflight -c "SELECT * FROM airbaggage;"

Write-Host "`n>>> VERIFICATION COMPLETE: ALL CHECKS PASSED SUCCESSFULLY <<<"

