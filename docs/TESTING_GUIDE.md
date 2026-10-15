# CARGOFLIGHT Testing & Demonstration Guide

## 1. Automated Verification Commands

### 1.1 Backend Test Suite (Maven)
Runs unit, integration, and service tests with in-memory dialect emulation:
```powershell
cd backend
mvn test "-Dspring.profiles.active=dev"
```
**Expected Outcome:**
- `BaggageServiceTest`: 3 tests, 0 failures (Registration, Duplicate Tag rejection, Valid/Invalid transitions).
- `RouteCalculationTest`: 2 tests, 0 failures (Clear spine path, Blockage detour routing).
- Total: 5 tests run, 0 failures, 0 errors.

### 1.2 Frontend Production Build (TypeScript & Vite)
Validates TypeScript compilation, module resolution, and production bundle generation:
```powershell
cd frontend
npm run build
```
**Expected Outcome:**
- Vite build completes with code `0`.
- 0 TypeScript errors.
- Bundle output generated in `dist/`.

---

## 2. End-to-End Live Demonstration Script

Follow this step-by-step demonstration flow during technical review or viva:

### Step 1: Authentication & Role Selection
1. Open `http://localhost:5173/login`.
2. Notice the **CARGOFLIGHT** branding and quick demo accounts.
3. Click the `admin` button to populate credentials (`admin` / `Aerotrace@2026`).
4. Click **Sign In to Operations Console**.

### Step 2: Operational Dashboard
1. Land on the **CARGOFLIGHT Operations Command Console** (`/`).
2. Verify live metrics: Total Baggage Processed, Screening & Sorting count, Loaded on Aircraft, and Active Exceptions.
3. Observe the wide aviation hero banner and verified 3-database connectivity cards.

### Step 3: Flight Operations & Cargo Manifests
1. Click **Flight Operations** (`/flights`) in the navy sidebar.
2. Filter flights by status (`SCHEDULED`, `BOARDING`, `ACTIVE`).
3. Click **Manifest** on flight `AI-508` to open the detail modal showing all manifested baggage units, passengers, and weights.
4. Click **Schedule Flight** to add a new flight (e.g. `6E-802` from `MAA` to `BOM`).

### Step 4: Baggage Registration
1. Click **Baggage Registration** (`/registration`).
2. Register a baggage unit:
   - Tag: `MAA-DEMO-999`
   - Passenger: `Vikram Seth`
   - PNR: `VS9921`
   - Flight: Select `AI-508`
   - Weight: `22.5` kg
3. Click **Register Baggage Unit**. Verify successful creation and initial movement history logging.

### Step 5: Baggage Handling Stage Console
1. Navigate to **Baggage Handling** (`/handling`).
2. Filter by stage `CHECKED_IN` or search for `MAA-DEMO-999`.
3. Click **Move Stage**.
4. Observe the valid next target options (`SECURITY_CLEARED` or `SECURITY_HELD`).
5. Select `SECURITY_CLEARED`, select handling point `MAA-SECURITY-01`, and click **Execute Stage Transition**.
6. Verify live confirmation and append-only movement history recording.

### Step 6: Baggage Journey Tracking
1. Navigate to **Track Baggage** (`/tracking`).
2. Enter tag `MAA-DEMO-999` (or click directly from the manifest).
3. Observe the visual stage timeline showing completed stages, current stage, and expected next checkpoints.

### Step 7: Live RFID/Barcode Scan Simulator
1. Navigate to **Live Scan Events** (`/scans`).
2. Select baggage tag `MAA-DEMO-999`, choose checkpoint `MAA-SORTING-01`, scan type `BARCODE_OPTICAL`.
3. Click **Simulate Scanner Event**.
4. Observe dual verification:
   - Operational state committed to PostgreSQL.
   - Raw scanner event dispatched to MongoDB (or safely noted if offline).
   - Try sending the exact same scan immediately to verify idempotency duplicate detection!

### Step 8: Route Optimization & Belt Blockage Simulation
1. Navigate to **Route Optimization** (`/routes`).
2. Select Origin `MAA-CHECKIN-01` and Destination `MAA-LOADING-01`.
3. Toggle the **Optimization Objective** between **Shortest Distance (Meters)** and **Fastest Travel Time (Seconds)**.
4. Click on an edge in the interactive SVG schematic (e.g. `MAA-SECURITY-01 -> MAA-SORTING-01`) to simulate a belt stoppage.
5. Watch the path automatically recalculate via the alternative bypass chute (`MAA-SECURITY-02`), flagging `Rerouted around block: YES`.

### Step 9: Exception Detection & Resolution
1. Navigate to **Exceptions** (`/exceptions`).
2. View existing open exceptions (e.g. baggage delayed beyond threshold).
3. Click **Resolve Exception**, enter an operational note (e.g. *Manual baggage inspection completed, unit placed on pier tug*), and confirm.

### Step 10: Terminal & Handling Zone Management
1. Navigate to **Terminal Management** (`/terminals`).
2. Inspect airport checkpoints, categories, zones, and capacity per hour.
3. Toggle a checkpoint's status between `ACTIVE` and `MAINTENANCE`.

### Step 11: Distributed 3-Database Health Center
1. Navigate to **Distributed Databases** (`/database-center`).
2. Confirm truthful health checks for the 3 runtime databases:
   - **PostgreSQL 17**: Operational master + `cargoflight_dw` warehouse schema.
   - **MongoDB 7.0**: Raw scanner telemetry with 7-day TTL.
   - **Neo4j 5.20**: Conveyor routing graph.
3. Click **Refresh PostgreSQL Warehouse** to execute the dimensional ETL routine. Observe the count of analytical facts generated.

### Step 12: Analytics & OLAP Dimensional Reporting
1. Navigate to **Analytics & Reports** (`/analytics`).
2. Inspect the **Real-Time Operational Analytics** tab with the dynamic hourly throughput histogram.
3. Click the **PostgreSQL Data Warehouse (cargoflight_dw)** tab to inspect OLAP star-schema dimensions: Volume by Terminal and Duration by Stage.
4. Click **Export Sanitized CSV** to verify authenticated CSV download.

### Step 13: System Settings
1. Navigate to **Settings** (`/settings`).
2. View and adjust operational parameters: Baggage Delay Threshold (45 min), Default Airport (MAA), Timezone, and Telemetry toggle.
3. Click **Save Operational Settings** and verify backend persistence.

### Step 14: Users, Roles & Security Audit
1. Navigate to **Users & Roles** (`/admin`).
2. Review authorized personnel, change an operator's role, or toggle active/suspended status.
3. Switch to the **Compliance Audit Trail** tab to view immutable audit logs of all actions performed during the demonstration.

### Step 15: Sign Out
1. Click the logout icon in the top navigation bar.
2. Return cleanly to the CARGOFLIGHT login portal.
