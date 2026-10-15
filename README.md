# CARGOFLIGHT — Airport Cargo-Flight & Baggage Tracking System

![CARGOFLIGHT](https://img.shields.io/badge/Airport-MAA%20Hub%20%7C%20Chennai-0878F9)
![Stack](https://img.shields.io/badge/Tech-React%20%7C%20Spring%20Boot%20%7C%20PostgreSQL-10B981)
![Databases](https://img.shields.io/badge/3--DB%20Architecture-PostgreSQL%20%7C%20MongoDB%20%7C%20Neo4j-00C2D7)
![Status](https://img.shields.io/badge/Status-Demonstration%20Ready-06182D)

## 1. Executive Overview

**CARGOFLIGHT** is a full-stack airport cargo-flight and baggage tracking system engineered to track baggage across its complete lifecycle:
**Passenger Check-in &rarr; Security EDS Screening &rarr; Automated Sorter Core &rarr; Inter-Pier High-Speed Conveyors &rarr; Ramp Cart Staging &rarr; Aircraft Cargo Hold Loading &rarr; Flight Transit &rarr; Destination Inbound Unloading &rarr; Baggage Reclaim Carousel Collection.**

> [!NOTE]
> All airport conveyor movements, x-ray screening events, and flights in this environment operate as **simulated operations** backed by authentic database records and real-time state machines. Physical RFID hardware, airline APIs, and aircraft transponder GPS are explicitly not connected.

---

## 2. Three-Database Runtime Architecture

CARGOFLIGHT strictly implements a **three-database runtime architecture** with zero external MySQL dependencies:

| System | Technology & Version | Database Name / Schema | Authoritative Purpose | Default Port |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Operational & Warehouse** | PostgreSQL 17 | `aerotrace_india`<br>Schema: `public` & `cargoflight_dw` | **Sole Authoritative Master** for baggage manifests, flights, handling points, append-only movement history, audit logs, and the **dedicated OLAP dimensional star-schema** (`cargoflight_dw`) for historical analytics. | `5432` |
| **Scanner Telemetry** | MongoDB 7.0 | `aerotrace_telemetry`<br>Collection: `raw_scanner_events` | High-throughput ingestion of raw barcode/RFID scanner events, optical confidence metadata, idempotency checks, and automated **7-day TTL retention policy**. | `27017` |
| **Airport Handling Graph** | Neo4j 5.20 Community | Default Graph | Graph shortest-path optimization (`NEO4J_CYPHER`) over airport handling nodes and conveyor belts. Features automatic fallback to PostgreSQL Dijkstra solver if Neo4j is offline. | `7687` (Bolt)<br>`7474` (HTTP) |

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, React Router 6, Lucide Icons, Pure Vanilla CSS Design Tokens with CARGOFLIGHT Brand System.
  - Colors: Navy `#06182D`, Dark Navy `#03111F`, Electric Blue `#0878F9`, Cyan Accent `#00C2D7`, Success `#10B981`, Warning `#F59E0B`, Error `#EF4444`.
- **Backend:** Java 21, Spring Boot 3.2, Spring Security 6 (Stateless JWT, authentic BCrypt hashing), Spring Data JPA / Hibernate, Flyway Database Migrations (V1, V2, V3), Maven.
- **Operational Standards:**
  - Timezone: `Asia/Kolkata` (IST, UTC+5:30) for interface; UTC for database storage.
  - Time Format: 24-hour military clock (e.g., `14:30:00 IST`).
  - Units: Metric Kilograms (kg) and Meters (m).

---

## 4. Quick Start Guide (Windows PowerShell)

### Prerequisites
- **Java 21** (`java -version`)
- **Apache Maven 3.9+** (`mvn -version`)
- **Node.js 18+ & npm** (`node -v`, `npm -v`)
- **Docker Desktop** (Optional for containerized PostgreSQL, MongoDB, Neo4j)

---

### Method A: With Docker Desktop (Full 3-DB Environment)

#### 1. Start the 3 Databases:
```powershell
docker compose up -d
```
*Starts `cargoflight-postgres` (5432), `cargoflight-mongodb` (27017), and `cargoflight-neo4j` (7687/7474).*

#### 2. Start the Spring Boot Backend:
```powershell
cd backend
mvn spring-boot:run
```
*Listens on `http://localhost:8080`. Executes Flyway migrations V1, V2, and V3 automatically.*

#### 3. Start the React Frontend:
```powershell
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

### Method B: Zero-Dependency Local Dev Mode (No Docker Required)

If Docker Desktop is not installed or running, CARGOFLIGHT provides an in-memory development profile with full PostgreSQL dialect emulation:

```powershell
# In backend directory:
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"

# In frontend directory:
npm run dev
```

---

## 5. Preconfigured Demo Accounts

All demo accounts use the secure password **`Aerotrace@2026`** (hashed with BCrypt):

| Username | Password | Role | Console Privileges |
| :--- | :--- | :--- | :--- |
| **`admin`** | `Aerotrace@2026` | `SYSTEM_ADMIN` | Full administrative control, user creation, settings, security audit logs, warehouse ETL refresh |
| **`ops_manager`** | `Aerotrace@2026` | `OPERATIONS_MANAGER` | Flight scheduling, terminal facility management, threshold settings, exception investigation |
| **`handler1`** | `Aerotrace@2026` | `BAGGAGE_HANDLER` | Baggage registration, stage transitions, scanner event simulator |
| **`security_off`** | `Aerotrace@2026` | `SECURITY_OFFICER` | Security checkpoint scan approvals, exception logging & resolution |

---

## 6. Required Application Modules

1. **Dashboard (`/`):** Real-time operational metrics, KPI cards, recent scan timeline, active flight manifests, and quick action buttons.
2. **Flight Operations (`/flights`):** Flight listing, flight number search, status filtering, manifest detail modal with associated baggage, and flight creation modal.
3. **Baggage Handling (`/handling`):** Operational stage console enforcing valid state transitions (CHECKED_IN &rarr; SECURITY_CLEARED &rarr; SORTED &rarr; IN_TRANSIT &rarr; READY_FOR_LOADING &rarr; LOADED &rarr; ARRIVED &rarr; DELIVERED_TO_BELT &rarr; CLAIMED).
4. **Track Baggage (`/tracking`):** Deep baggage journey tracker by tag, flight, or passenger with visual stage timeline and full movement history.
5. **Route Optimization (`/routes`):** Interactive conveyor schematic with objective selection (**Shortest Distance** vs **Fastest Travel Time**), live stoppage simulation, and rerouting.
6. **Terminal Management (`/terminals`):** Terminals, zones, sorting loops, conveyor belts, scanner devices, and capacity toggles.
7. **Live Scan Events (`/scans`):** Realistic RFID/barcode scanner event simulator with idempotency verification and telemetry dispatch.
8. **Analytics & Reports (`/analytics`):** Real-time SQL aggregations, hourly throughput chart, authenticated sanitized CSV export, and PostgreSQL `cargoflight_dw` OLAP reports.
9. **Distributed Databases (`/database-center`):** Live health monitoring for PostgreSQL, MongoDB, and Neo4j, plus manual Warehouse OLAP refresh.
10. **Users & Roles (`/admin`):** User management, operator account creation, role assignment, active/suspend toggle, and compliance audit trail.
11. **Settings (`/settings`):** Operational thresholds (delay threshold in minutes, default hub, timezone, warehouse refresh cadence, telemetry toggle).
12. **Baggage Registration (`/registration`):** Complete registration workflow with PNR, flight validation, weight check, and initial movement event creation.
13. **Exceptions Management (`/exceptions`):** Investigation, resolution notes, and tracking for delayed, misrouted, or missing baggage items.

---

## 7. Verification & Testing Commands

```powershell
# Run backend test suite:
cd backend
mvn test "-Dspring.profiles.active=dev"

# Run frontend production build:
cd frontend
npm run build
```

---

## 8. Documentation Index

- [Project Audit & Baseline Findings](docs/PROJECT_AUDIT.md)
- [System Architecture & 3-DB Design](docs/architecture.md)
- [Database Schema & Data Warehouse Star-Schema](docs/database-design.md)
- [REST API Specification](docs/api-documentation.md)
- [Testing & Demonstration Guide](docs/TESTING_GUIDE.md)
