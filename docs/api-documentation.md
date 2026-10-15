# CARGOFLIGHT REST API Documentation

Base URI: `/api/v1`  
Authentication: HTTP Authorization Header (`Bearer <JWT_TOKEN>`)

All responses adhere to the standard envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-10-15T01:30:00Z"
}
```

---

## 1. Authentication (`/api/v1/auth`)

### `POST /auth/login`
Authenticate operator credentials and obtain a JWT bearer token.
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "Aerotrace@2026"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "token": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "username": "admin",
    "fullName": "System Administrator",
    "role": "SYSTEM_ADMIN",
    "airport": "MAA"
  }
  ```

---

## 2. Dashboard (`/api/v1/dashboard`)

### `GET /dashboard/summary`
Retrieves consolidated operational summary, KPI counts, 3-database connectivity statuses, and the 8 most recent baggage movement events.

---

## 3. Baggage Manifests (`/api/v1/baggage`)

### `POST /baggage/register`
- **RBAC:** `SYSTEM_ADMIN`, `OPERATIONS_MANAGER`, `BAGGAGE_HANDLER`
- **Request Body:**
  ```json
  {
    "baggageTag": "MAA-AI-508-001",
    "flightId": 1,
    "passengerName": "Suresh Raina",
    "passengerPnr": "AI8472",
    "originIata": "MAA",
    "destinationIata": "DEL",
    "weightKg": 21.5,
    "initialHandlingPointId": "MAA-CHECKIN-01"
  }
  ```

### `GET /baggage/{tag}`
Retrieves complete baggage record including append-only movement history timeline and next expected checkpoint.

### `POST /baggage/{tag}/transition`
- **RBAC:** `SYSTEM_ADMIN`, `OPERATIONS_MANAGER`, `BAGGAGE_HANDLER`
- **Request Body:**
  ```json
  {
    "targetStatus": "SECURITY_CLEARED",
    "handlingPointId": "MAA-SECURITY-01",
    "notes": "Passed Level 1 EDS X-Ray standard screening",
    "scannerId": "MANUAL_HANDLING_CONSOLE"
  }
  ```

### `GET /baggage/search?query={q}&status={s}&flightId={id}&page=0&size=20`
Paginated search over baggage manifests.

---

## 4. Flight Operations (`/api/v1/flights`)

### `GET /flights`
Retrieves all flights servicing MAA Hub with departure times, gate, and baggage load percentages.

### `GET /flights/{id}`
Retrieves detailed flight metadata.

### `GET /flights/{id}/baggage`
Retrieves all manifested baggage items associated with the flight.

### `POST /flights`
- **RBAC:** `SYSTEM_ADMIN`, `OPERATIONS_MANAGER`, `FLIGHT_OPERATOR`
- **Request Body:**
  ```json
  {
    "flightNumber": "AI-582",
    "airlineCode": "AI",
    "airlineName": "Air India",
    "originIata": "MAA",
    "destinationIata": "DEL",
    "terminal": "T2",
    "gate": "G12",
    "totalExpectedBags": 140
  }
  ```

### `PATCH /flights/{id}/status`
- **RBAC:** `SYSTEM_ADMIN`, `OPERATIONS_MANAGER`, `FLIGHT_OPERATOR`
- **Request Body:** `{"status": "BOARDING"}`

---

## 5. Terminal & Handling Points (`/api/v1/handling-points`)

### `GET /handling-points`
Retrieves all airport checkpoints, connected conveyor nodes, categories, zones, and active scanner counts.

### `PATCH /handling-points/{id}/status`
- **RBAC:** `SYSTEM_ADMIN`, `OPERATIONS_MANAGER`
- **Request Body:** `{"status": "MAINTENANCE"}`

---

## 6. Scanner Event Simulator (`/api/v1/scans`)

### `POST /scans/submit`
- **RBAC:** `SYSTEM_ADMIN`, `OPERATIONS_MANAGER`, `BAGGAGE_HANDLER`, `SECURITY_OFFICER`
- **Request Body:**
  ```json
  {
    "baggageTag": "MAA-6E-2041-001",
    "scannerId": "SCN-CHK-T2-01",
    "handlingPointId": "MAA-CHECKIN-01",
    "scanType": "BARCODE_OPTICAL",
    "idempotencyKey": "SCAN-6E2041-001",
    "opticalConfidenceScore": 0.992,
    "notes": "Simulated optical scan at check-in"
  }
  ```

### `GET /scans/recent`
Retrieves the 20 most recent movement events.

---

## 7. Route Optimization (`/api/v1/routes`)

### `POST /routes/calculate`
Calculates optimal path through airport handling network.
- **Request Body:**
  ```json
  {
    "originPointId": "MAA-CHECKIN-01",
    "destinationPointId": "MAA-LOADING-01",
    "blockedConnectionIds": ["MAA-SECURITY-01->MAA-SORTING-01"],
    "objective": "DISTANCE"
  }
  ```
- **Response:**
  ```json
  {
    "routeFound": true,
    "originPointId": "MAA-CHECKIN-01",
    "destinationPointId": "MAA-LOADING-01",
    "orderedPath": [ ... ],
    "totalDistanceMeters": 645,
    "estimatedTraversalSeconds": 465,
    "routingEngine": "NEO4J_CYPHER",
    "reroutedDueToBlockage": true,
    "message": "Route calculated with blockage bypass"
  }
  ```

---

## 8. Analytics & Data Warehouse (`/api/v1/analytics` & `/api/v1/warehouse`)

### `GET /analytics/summary`
Dynamic operational analytics (volume, success rate, stage distribution, hourly throughput).

### `GET /analytics/export/csv`
Downloads authenticated, formula-injection-sanitized CSV export of all baggage movements.

### `POST /warehouse/refresh`
- **RBAC:** `SYSTEM_ADMIN`, `OPERATIONS_MANAGER`, `DATABASE_ADMIN`
- Executes idempotent dimensional ETL loading facts into `cargoflight_dw`.

### `GET /warehouse/metrics`
Retrieves OLAP dimensional reports (`volumeByTerminal`, `durationByStage`, `flightPerformance`).

---

## 9. Distributed Database Health (`/api/v1/database-center`)

### `GET /database-center/status`
Performs genuine connection verification across PostgreSQL 17, MongoDB 7.0, and Neo4j 5.20.

---

## 10. System Settings (`/api/v1/settings`)

### `GET /settings`
Retrieves operational system configuration parameters.

### `PUT /settings`
- **RBAC:** `SYSTEM_ADMIN`, `OPERATIONS_MANAGER`
- Updates batch of configuration key-value pairs.

---

## 11. User Administration (`/api/v1/admin`)

- `GET /admin/users`: List operator accounts.
- `POST /admin/users`: Create operator account with BCrypt password hashing.
- `PATCH /admin/users/{id}/status`: Toggle active / suspended status.
- `PATCH /admin/users/{id}/role`: Update RBAC role.
- `GET /admin/audit-logs`: Paginated compliance security audit logs.
