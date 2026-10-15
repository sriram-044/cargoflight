# CARGOFLIGHT Database Architecture & Setup Guide

CARGOFLIGHT operates across three specialized database engines with clear separation of concerns.

---

## 1. Summary of Database Systems

| Database | Role | Target Engine | Schema / Database | Port / Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL 17** | Authoritative Operational & Analytical Warehouse | Relational SQL | `public` & `cargoflight_dw` | `localhost:5432` / JDBC |
| **MongoDB Atlas** | High-Velocity Scanner Telemetry & Diagnostics | Document NoSQL | `aerotrace_telemetry` | Cloud SRV (`cargoflight-cluster.nvm22jt.mongodb.net`) |
| **Neo4j 5.20** | Conveyor Route Optimization & Handling Graph | Graph Database | Default | `bolt://localhost:7687` |

---

## 2. PostgreSQL Setup & Migrations

- **Database:** `aerotrace_india`
- **User:** `aerotrace_app`
- **Docker Service:** `cargoflight-postgres` in `docker-compose.yml`

### Flyway Migrations (`backend/src/main/resources/db/migration`):
- `V1__initial_schema.sql`: Core operational tables (`airports`, `flights`, `handling_points`, `handling_point_connections`, `scanner_devices`, `baggage`, `baggage_movement_history`, `baggage_exceptions`, `system_settings`, `users`, `audit_logs`).
- `V2__seed_maa_data.sql`: Seed data for Chennai MAA airport, demo users, flights, handling points, scanners, and sample baggage items.
- `V3__warehouse_olap_schema.sql`: Dedicated `cargoflight_dw` dimensional star-schema (`dim_terminal`, `dim_flight`, `dim_handling_point`, `dim_baggage_status`, `fact_baggage_lifecycle`, `fact_handling_scans`, `fact_flight_baggage_performance`, and analytical OLAP views).

---

## 3. MongoDB Atlas Telemetry Setup

- **Cluster Host:** `cargoflight-cluster.nvm22jt.mongodb.net`
- **Database:** `aerotrace_telemetry`
- **Application User:** `cargoflight_app`
- **Collections:**
  - `raw_scanner_events`: Append-only scanner event log with unique `idempotencyKey` index and 7-day TTL expiration (`timestamp`).
  - `scanner_diagnostics`: Scanner battery, temperature, firmware status with 7-day TTL (`recordedAt`).
  - `scan_dead_letter_queue`: Unparseable or rejected scan payloads with 14-day TTL (`failedAt`).

### Automatic Schema Verification
[`MongoIndexInitializer.java`](file:///d:/aero/backend/src/main/java/com/aerotrace/maa/integration/mongodb/MongoIndexInitializer.java) runs automatically on Spring application startup, safely verifying collections and indexes without dropping existing data.

---

## 4. Neo4j Graph Setup

- **Docker Service:** `cargoflight-neo4j` in `docker-compose.yml`
- **Auth:** `neo4j/aerotrace_neo4j_2026`
- **Cypher Schema (`database/neo4j/schema.cypher`):**
  - **Nodes:** `(:HandlingPoint)`
  - **Relationships:** `(:HandlingPoint)-[:FEEDS_INTO]->(:HandlingPoint)`
- **Graceful Fallback:** If Neo4j is offline or disabled, [`RouteService.java`](file:///d:/aero/backend/src/main/java/com/aerotrace/maa/service/RouteService.java) seamlessly switches to an in-memory Dijkstra solver querying PostgreSQL `handling_point_connections`.

---

## 5. Verification Commands

### Check Live Status via Database Center
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/demo-session").data.token
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/database-center/status" -Headers @{ Authorization = "Bearer $token" }
```
Expected output:
- `PostgreSQL 17`: PASS
- `MongoDB Atlas (Cloud Telemetry)`: PASS
- `Neo4j Graph`: PASS
