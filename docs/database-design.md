# CARGOFLIGHT Database Design & Data Warehouse Specification

## 1. Relational Database Design (PostgreSQL 17)

### 1.1 Operational Schema (`public`)

```sql
-- Core Airports
CREATE TABLE airports (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    city VARCHAR(64) NOT NULL,
    country VARCHAR(64) NOT NULL,
    timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Flight Operations
CREATE TABLE flights (
    id BIGSERIAL PRIMARY KEY,
    flight_number VARCHAR(16) NOT NULL,
    airline_code VARCHAR(4) NOT NULL,
    airline_name VARCHAR(64) NOT NULL,
    origin_iata VARCHAR(3) REFERENCES airports(code),
    destination_iata VARCHAR(3) REFERENCES airports(code),
    scheduled_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    terminal VARCHAR(8) NOT NULL DEFAULT 'T2',
    gate VARCHAR(16) NOT NULL DEFAULT 'G12',
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    total_expected_bags INT NOT NULL DEFAULT 0,
    total_loaded_bags INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Airport Handling Facilities & Checkpoints
CREATE TABLE handling_points (
    id VARCHAR(32) PRIMARY KEY,
    airport_code VARCHAR(3) REFERENCES airports(code),
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL, -- CHECKIN, SECURITY, SORTER, CONVEYOR, LOADING, CLAIM
    zone VARCHAR(32) NOT NULL,     -- LANDSIDE_T2, SECURITY_CHECK, BASEMENT_BHS, AIRSIDE_RAMP, BAGGAGE_CLAIM
    operational_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    capacity_per_hour INT NOT NULL DEFAULT 1200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conveyor Network Topology Edges
CREATE TABLE handling_point_connections (
    id BIGSERIAL PRIMARY KEY,
    from_point_id VARCHAR(32) REFERENCES handling_points(id),
    to_point_id VARCHAR(32) REFERENCES handling_points(id),
    distance_meters INT NOT NULL DEFAULT 50,
    estimated_traversal_seconds INT NOT NULL DEFAULT 45,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_connection UNIQUE (from_point_id, to_point_id)
);

-- Baggage Manifests
CREATE TABLE baggage (
    id BIGSERIAL PRIMARY KEY,
    baggage_tag VARCHAR(32) UNIQUE NOT NULL,
    flight_id BIGINT REFERENCES flights(id),
    passenger_name VARCHAR(128) NOT NULL,
    passenger_pnr VARCHAR(16) NOT NULL,
    origin_iata VARCHAR(3) REFERENCES airports(code),
    destination_iata VARCHAR(3) REFERENCES airports(code),
    weight_kg NUMERIC(5,2) NOT NULL,
    current_status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED',
    current_handling_point_id VARCHAR(32) REFERENCES handling_points(id),
    last_scan_time TIMESTAMP WITH TIME ZONE,
    is_delayed BOOLEAN DEFAULT FALSE,
    is_misrouted BOOLEAN DEFAULT FALSE,
    is_rush BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Append-Only Temporal Movement History
CREATE TABLE baggage_movement_history (
    id BIGSERIAL PRIMARY KEY,
    baggage_id BIGINT REFERENCES baggage(id) ON DELETE CASCADE,
    baggage_tag VARCHAR(32) NOT NULL,
    handling_point_id VARCHAR(32) REFERENCES handling_points(id),
    previous_point_id VARCHAR(32) REFERENCES handling_points(id),
    status_before VARCHAR(32) NOT NULL,
    status_after VARCHAR(32) NOT NULL,
    scanner_id VARCHAR(32),
    scan_type VARCHAR(32) DEFAULT 'BARCODE',
    operator_username VARCHAR(64) DEFAULT 'system',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- System Operational Settings
CREATE TABLE system_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'SYSTEM',
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64) DEFAULT 'SYSTEM'
);
```

---

## 2. PostgreSQL Data Warehouse OLAP Schema (`cargoflight_dw`)

A dedicated dimensional star-schema located in the same PostgreSQL service under the schema `cargoflight_dw`:

### 2.1 Dimensions
- `dim_terminal` (terminal_key, terminal_code, airport_code, terminal_name)
- `dim_flight` (flight_key, flight_number, airline_code, airline_name, origin_iata, destination_iata)
- `dim_handling_point` (handling_point_key, point_id, point_name, category, zone)
- `dim_baggage_status` (status_key, status_code, status_category, display_order)

### 2.2 Facts
- `fact_baggage_lifecycle` (fact_id, baggage_tag, flight_key, terminal_key, origin_iata, destination_iata, weight_kg, final_status, registered_at, loaded_at, total_transit_duration_minutes, is_delayed, is_misrouted, is_rush)
- `fact_handling_scans` (scan_fact_id, baggage_tag, handling_point_key, status_before, status_after, scan_type, scan_timestamp, processing_duration_seconds)
- `fact_flight_baggage_performance` (flight_perf_id, flight_key, departure_timestamp, total_expected_bags, total_loaded_bags, load_completion_percentage, reconciliation_status)

### 2.3 OLAP Analytical Views
1. `v_olap_volume_by_terminal`: Baggage volume grouped by terminal and airport.
2. `v_olap_duration_by_stage`: Average stage-to-stage transition duration (minutes) across checkpoints.
3. `v_olap_flight_performance`: Flight-wise baggage reconciliation rates and on-time performance.
4. `v_olap_hourly_throughput`: Hourly scan velocity and unit throughput.

---

## 3. MongoDB 7.0 Collection Design

- **Collection:** `raw_scanner_events`
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "idempotencyKey": "SCAN-6E2041-001",
  "baggageTag": "MAA-6E-2041-001",
  "scannerId": "SCN-CHK-T2-01",
  "handlingPointId": "MAA-CHECKIN-01",
  "scanType": "BARCODE_OPTICAL",
  "opticalConfidenceScore": 0.994,
  "deviceMetadata": {
    "firmware": "v4.2.1",
    "ip": "10.14.20.101"
  },
  "ingestedAt": ISODate("2026-10-15T01:30:00Z"),
  "expireAt": ISODate("2026-10-22T01:30:00Z")
}
```
- **Indexes:**
  - `idempotencyKey`: Unique index ensuring duplicate scans are detected.
  - `expireAt`: TTL index (`expireAfterSeconds: 0`) automatically purging documents after 7 days.

---

## 4. Neo4j Graph Topology Schema

- **Nodes:**
  - `(:HandlingPoint {id: "MAA-CHECKIN-01", name: "Check-in Desks", category: "CHECKIN", zone: "LANDSIDE_T2", operationalStatus: "ACTIVE", capacityPerHour: 1400})`
- **Edges:**
  - `(:HandlingPoint)-[:FEEDS_INTO {distanceMeters: 85, estimatedTraversalSeconds: 65, isActive: true}]->(:HandlingPoint)`
- **Path Query (Cypher):**
```cypher
MATCH (start:HandlingPoint {id: $originId}), (end:HandlingPoint {id: $destId})
MATCH p = shortestPath((start)-[:FEEDS_INTO*]->(end))
WHERE ALL(r IN relationships(p) WHERE r.isActive = true)
RETURN p, reduce(dist = 0, r IN relationships(p) | dist + r.distanceMeters) AS totalDist;
```
