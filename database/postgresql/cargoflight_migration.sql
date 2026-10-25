-- ==============================================================================
-- CARGOFLIGHT Database Safe Non-Destructive Schema Augmentation & Migration
-- Database: cargoflight
-- Preserves existing tables: airbaggage and baggage
-- ==============================================================================

-- 1. Airports Table
CREATE TABLE IF NOT EXISTS airports (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    city VARCHAR(64) NOT NULL,
    country VARCHAR(64) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Flights Schedule Table
CREATE TABLE IF NOT EXISTS flights (
    id BIGSERIAL PRIMARY KEY,
    flight_number VARCHAR(16) NOT NULL,
    airline_code VARCHAR(4) NOT NULL,
    airline_name VARCHAR(64) NOT NULL,
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    scheduled_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    terminal VARCHAR(8) NOT NULL DEFAULT 'T2',
    gate VARCHAR(16) NOT NULL DEFAULT 'G12',
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    total_expected_bags INT NOT NULL DEFAULT 0,
    total_loaded_bags INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_flight_direction CHECK (origin_iata = 'MAA' OR destination_iata = 'MAA')
);
CREATE INDEX IF NOT EXISTS idx_flights_num ON flights (flight_number);
CREATE INDEX IF NOT EXISTS idx_flights_departure ON flights (scheduled_departure);
CREATE INDEX IF NOT EXISTS idx_flights_status ON flights (status);

-- 3. Handling Points Checkpoints
CREATE TABLE IF NOT EXISTS handling_points (
    id VARCHAR(32) PRIMARY KEY,
    airport_code VARCHAR(3) NOT NULL REFERENCES airports(code),
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    zone VARCHAR(64) NOT NULL,
    operational_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    capacity_per_hour INT NOT NULL DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_handling_points_cat ON handling_points (category);
CREATE INDEX IF NOT EXISTS idx_handling_points_status ON handling_points (operational_status);

-- 4. Handling Point Connections (Routing Network)
CREATE TABLE IF NOT EXISTS handling_point_connections (
    id BIGSERIAL PRIMARY KEY,
    from_point_id VARCHAR(32) NOT NULL REFERENCES handling_points(id),
    to_point_id VARCHAR(32) NOT NULL REFERENCES handling_points(id),
    distance_meters DECIMAL(7, 2) NOT NULL,
    estimated_traversal_seconds INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    restriction_notes VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_point_connection UNIQUE (from_point_id, to_point_id)
);
CREATE INDEX IF NOT EXISTS idx_connections_from ON handling_point_connections (from_point_id);
CREATE INDEX IF NOT EXISTS idx_connections_to ON handling_point_connections (to_point_id);

-- 5. Scanner Devices Registry
CREATE TABLE IF NOT EXISTS scanner_devices (
    id VARCHAR(32) PRIMARY KEY,
    handling_point_id VARCHAR(32) NOT NULL REFERENCES handling_points(id),
    device_type VARCHAR(32) NOT NULL,
    model VARCHAR(64) NOT NULL,
    serial_number VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ONLINE',
    last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scanners_point ON scanner_devices (handling_point_id);

-- 6. Non-Destructive Augmentation of Existing 'baggage' Table
-- Note: 'airbaggage' is completely untouched.
DO $$
BEGIN
    -- Ensure dedicated sequence for column 'id'
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'baggage_id_auto_seq') THEN
        CREATE SEQUENCE baggage_id_auto_seq;
    END IF;

    -- Add 'id' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'baggage' AND column_name = 'id') THEN
        ALTER TABLE baggage ADD COLUMN id BIGINT DEFAULT nextval('baggage_id_auto_seq');
        UPDATE baggage SET id = baggage_id WHERE id IS NULL;
        ALTER TABLE baggage ALTER COLUMN id SET NOT NULL;
    END IF;

    -- Ensure 'id' has UNIQUE constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_baggage_id') THEN
        ALTER TABLE baggage ADD CONSTRAINT uq_baggage_id UNIQUE (id);
    END IF;
END $$;

-- Add tracking and operational columns without modifying existing ones
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS flight_id BIGINT;
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS passenger_pnr VARCHAR(16) DEFAULT 'PNR001';
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS origin_iata VARCHAR(3) DEFAULT 'MAA';
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS destination_iata VARCHAR(3) DEFAULT 'DEL';
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5, 2) DEFAULT 15.00;
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS current_handling_point_id VARCHAR(32);
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS last_scan_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS is_delayed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS is_misrouted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS is_rush BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add foreign keys on baggage
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_baggage_flight') THEN
        ALTER TABLE baggage ADD CONSTRAINT fk_baggage_flight FOREIGN KEY (flight_id) REFERENCES flights(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_baggage_point') THEN
        ALTER TABLE baggage ADD CONSTRAINT fk_baggage_point FOREIGN KEY (current_handling_point_id) REFERENCES handling_points(id);
    END IF;
END $$;

-- 7. Baggage Movement History Table
CREATE TABLE IF NOT EXISTS baggage_movement_history (
    id BIGSERIAL PRIMARY KEY,
    baggage_id BIGINT NOT NULL,
    baggage_tag VARCHAR(32) NOT NULL,
    handling_point_id VARCHAR(32) NOT NULL REFERENCES handling_points(id),
    previous_point_id VARCHAR(32) REFERENCES handling_points(id),
    status_before VARCHAR(32) NOT NULL,
    status_after VARCHAR(32) NOT NULL,
    scanner_id VARCHAR(32) REFERENCES scanner_devices(id),
    scan_type VARCHAR(32) NOT NULL DEFAULT 'FIXED_BARCODE',
    operator_username VARCHAR(64) NOT NULL DEFAULT 'system',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL
);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_history_baggage') THEN
        ALTER TABLE baggage_movement_history ADD CONSTRAINT fk_history_baggage FOREIGN KEY (baggage_id) REFERENCES baggage(id) ON DELETE CASCADE;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_history_baggage_id ON baggage_movement_history (baggage_id);
CREATE INDEX IF NOT EXISTS idx_history_baggage_tag ON baggage_movement_history (baggage_tag);
CREATE INDEX IF NOT EXISTS idx_history_point ON baggage_movement_history (handling_point_id);
CREATE INDEX IF NOT EXISTS idx_history_recorded ON baggage_movement_history (recorded_at);

-- 8. Baggage Exceptions Table
CREATE TABLE IF NOT EXISTS baggage_exceptions (
    id BIGSERIAL PRIMARY KEY,
    baggage_id BIGINT NOT NULL,
    baggage_tag VARCHAR(32) NOT NULL,
    exception_type VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    handling_point_id VARCHAR(32) NOT NULL REFERENCES handling_points(id),
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    resolved_by VARCHAR(64) NULL,
    resolution_notes TEXT NULL
);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_exceptions_baggage') THEN
        ALTER TABLE baggage_exceptions ADD CONSTRAINT fk_exceptions_baggage FOREIGN KEY (baggage_id) REFERENCES baggage(id) ON DELETE CASCADE;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_exceptions_tag ON baggage_exceptions (baggage_tag);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON baggage_exceptions (status);
CREATE INDEX IF NOT EXISTS idx_exceptions_severity ON baggage_exceptions (severity);

-- 9. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs (username);

-- 11. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(64) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    category VARCHAR(32) NOT NULL DEFAULT 'SYSTEM',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Trigger to sync flight_number and terminal automatically on insert/update
CREATE OR REPLACE FUNCTION sync_baggage_flight_info()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.flight_id IS NOT NULL THEN
        SELECT flight_number, terminal INTO NEW.flight_number, NEW.terminal
        FROM flights WHERE id = NEW.flight_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_baggage_flight ON baggage;
CREATE TRIGGER trg_sync_baggage_flight
BEFORE INSERT OR UPDATE OF flight_id ON baggage
FOR EACH ROW
EXECUTE FUNCTION sync_baggage_flight_info();

-- ==============================================================================
-- 13. SEED DATA (Non-Destructive - ON CONFLICT DO NOTHING)
-- ==============================================================================

-- Airports
INSERT INTO airports (code, name, city, country, timezone, latitude, longitude, is_active)
VALUES ('MAA', 'Chennai International Airport', 'Chennai', 'India', 'Asia/Kolkata', 12.994112, 80.170866, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Handling points
INSERT INTO handling_points (id, airport_code, name, category, zone, operational_status, capacity_per_hour)
VALUES
('MAA-CHECKIN-01', 'MAA', 'Check-in Desks Terminal 2 Zone A', 'CHECK_IN', 'TERMINAL_2_LEVEL_1', 'ACTIVE', 1200),
('MAA-SECURITY-01', 'MAA', 'Standard Screening Level 1 X-Ray', 'SECURITY', 'BHS_BASEMENT_ZONE_A', 'ACTIVE', 1500),
('MAA-SECURITY-02', 'MAA', 'Secondary Explosive Detection CTX', 'SECURITY', 'BHS_BASEMENT_ZONE_B', 'ACTIVE', 450),
('MAA-SORTING-01', 'MAA', 'Automated Main Sorter Core Loop', 'SORTING', 'SORTING_HALL_CENTRAL', 'ACTIVE', 3000),
('MAA-SORTING-02', 'MAA', 'High-Speed Cross-Belt Diverter', 'SORTING', 'SORTING_HALL_SOUTH', 'ACTIVE', 2200),
('MAA-CONVEYOR-01', 'MAA', 'Main Inter-Pier High-Speed Belt', 'CONVEYOR', 'TUNNEL_SPINE_PIER_1', 'ACTIVE', 2500),
('MAA-TRANSFER-01', 'MAA', 'International Transfer Baggage Induction', 'TRANSFER', 'TERMINAL_1_CONNECT_CORRIDOR', 'ACTIVE', 800),
('MAA-LOADING-01', 'MAA', 'Airside Tug Cart Make-up Carousel 01', 'LOADING', 'AIRSIDE_RAMP_GATE_11_15', 'ACTIVE', 900),
('MAA-LOADING-02', 'MAA', 'Airside Tug Cart Make-up Carousel 02', 'LOADING', 'AIRSIDE_RAMP_GATE_16_20', 'ACTIVE', 900),
('MAA-ARRIVAL-01', 'MAA', 'Inbound Aircraft Unload Receiving Induction', 'ARRIVAL', 'AIRSIDE_INBOUND_DECK', 'ACTIVE', 1800),
('MAA-CLAIM-01', 'MAA', 'Domestic Reclaim Carousel Belt 03', 'CLAIM', 'ARRIVALS_HALL_GROUND', 'ACTIVE', 1200)
ON CONFLICT (id) DO NOTHING;

-- Handling point connections
INSERT INTO handling_point_connections (from_point_id, to_point_id, distance_meters, estimated_traversal_seconds, is_active, restriction_notes)
VALUES
('MAA-CHECKIN-01', 'MAA-SECURITY-01', 45.0, 90, TRUE, 'Standard passenger check-in to Level 1 EDS'),
('MAA-SECURITY-01', 'MAA-SORTING-01', 120.0, 180, TRUE, 'Cleared baggage high-speed descent to sorting core'),
('MAA-SECURITY-01', 'MAA-SECURITY-02', 25.0, 60, TRUE, 'Diverted baggage to CTX Level 2 Explosive Resolution'),
('MAA-SECURITY-02', 'MAA-SORTING-01', 105.0, 160, TRUE, 'Cleared after secondary CTX inspection'),
('MAA-SORTING-01', 'MAA-CONVEYOR-01', 80.0, 120, TRUE, 'Core loop diverter to Pier 1 spine belt'),
('MAA-SORTING-01', 'MAA-SORTING-02', 60.0, 90, TRUE, 'Load balance link to South sorter'),
('MAA-SORTING-02', 'MAA-LOADING-02', 150.0, 240, TRUE, 'South sorting chutes to Tug Carousel 02'),
('MAA-CONVEYOR-01', 'MAA-LOADING-01', 200.0, 300, TRUE, 'High-speed pier tunnel to Tug Carousel 01'),
('MAA-TRANSFER-01', 'MAA-SECURITY-01', 75.0, 120, TRUE, 'Transfer induction bags rescreened at Level 1'),
('MAA-ARRIVAL-01', 'MAA-CLAIM-01', 95.0, 150, TRUE, 'Aircraft unload induction direct to domestic claim belt 03'),
('MAA-ARRIVAL-01', 'MAA-TRANSFER-01', 110.0, 180, TRUE, 'Connecting bags from arrival apron to transfer deck')
ON CONFLICT (from_point_id, to_point_id) DO NOTHING;

-- Scanner devices
INSERT INTO scanner_devices (id, handling_point_id, device_type, model, serial_number, ip_address, status)
VALUES
('SCN-MAA-CK01', 'MAA-CHECKIN-01', 'FIXED_BARCODE', 'Datalogic Matrix 320', 'SN-DL-883491', '10.12.1.14', 'ONLINE'),
('SCN-MAA-SEC1', 'MAA-SECURITY-01', 'FIXED_RFID', 'Zebra FX9600 Industrial', 'SN-ZB-441209', '10.12.2.08', 'ONLINE'),
('SCN-MAA-SEC2', 'MAA-SECURITY-02', 'FIXED_RFID', 'Zebra FX9600 Industrial', 'SN-ZB-441210', '10.12.2.09', 'ONLINE'),
('SCN-MAA-SRT1', 'MAA-SORTING-01', 'FIXED_BARCODE', 'Cognex DataMan 370', 'SN-CG-992110', '10.12.3.01', 'ONLINE'),
('SCN-MAA-SRT2', 'MAA-SORTING-02', 'FIXED_BARCODE', 'Cognex DataMan 370', 'SN-CG-992111', '10.12.3.02', 'ONLINE'),
('SCN-MAA-LD01', 'MAA-LOADING-01', 'MOBILE_TERMINAL', 'Honeywell Dolphin CT60', 'SN-HW-774012', '10.12.4.15', 'ONLINE'),
('SCN-MAA-LD02', 'MAA-LOADING-02', 'MOBILE_TERMINAL', 'Honeywell Dolphin CT60', 'SN-HW-774013', '10.12.4.16', 'ONLINE'),
('SCN-MAA-CLM1', 'MAA-CLAIM-01', 'FIXED_BARCODE', 'SICK CLV690 Ultra', 'SN-SICK-884199', '10.12.4.40', 'ONLINE')
ON CONFLICT (id) DO NOTHING;

-- Flights (including friend's AI202 flight on Terminal T1!)
INSERT INTO flights (id, flight_number, airline_code, airline_name, origin_iata, destination_iata, scheduled_departure, scheduled_arrival, terminal, gate, status, total_expected_bags, total_loaded_bags)
VALUES
(1, '6E-2041', '6E', 'IndiGo Airlines', 'MAA', 'DEL', CURRENT_TIMESTAMP + INTERVAL '2 hour', CURRENT_TIMESTAMP + INTERVAL '4 hour 45 min', 'T2', 'G12', 'SCHEDULED', 145, 82),
(2, 'AI-440', 'AI', 'Air India', 'MAA', 'BOM', CURRENT_TIMESTAMP + INTERVAL '3 hour 15 min', CURRENT_TIMESTAMP + INTERVAL '5 hour', 'T2', 'G15', 'SCHEDULED', 120, 45),
(3, 'EK-545', 'EK', 'Emirates', 'MAA', 'DXB', CURRENT_TIMESTAMP + INTERVAL '4 hour 30 min', CURRENT_TIMESTAMP + INTERVAL '8 hour 45 min', 'T2', 'G22', 'SCHEDULED', 260, 110),
(4, 'SQ-529', 'SQ', 'Singapore Airlines', 'MAA', 'SIN', CURRENT_TIMESTAMP + INTERVAL '6 hour', CURRENT_TIMESTAMP + INTERVAL '10 hour 15 min', 'T2', 'G24', 'SCHEDULED', 190, 30),
(5, '6E-6188', '6E', 'IndiGo Airlines', 'BLR', 'MAA', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '10 min', 'T2', 'G08', 'ARRIVED', 115, 115),
(6, 'BA-035', 'BA', 'British Airways', 'LHR', 'MAA', CURRENT_TIMESTAMP - INTERVAL '30 min', CURRENT_TIMESTAMP + INTERVAL '40 min', 'T2', 'G19', 'ARRIVED', 240, 215),
(7, 'AI202', 'AI', 'Air India', 'MAA', 'DEL', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '3 hour 30 min', 'T1', 'G05', 'SCHEDULED', 100, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('flights_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM flights), 1), 7));

-- Users
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES
('admin', 'admin@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Karthik Subramanian', 'SYSTEM_ADMIN', TRUE),
('ops_manager', 'ops@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Priya Ramanathan', 'OPERATIONS_MANAGER', TRUE),
('handler1', 'handler1@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Murali Vijay', 'BAGGAGE_HANDLER', TRUE),
('security_off', 'security@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Deepa Natarajan', 'SECURITY_OFFICER', TRUE),
('analyst', 'analyst@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Siddharth Chandran', 'ANALYST', TRUE),
('dbadmin', 'dbadmin@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Ananya Sridhar', 'DATABASE_ADMIN', TRUE)
ON CONFLICT (username) DO NOTHING;

-- System settings
INSERT INTO system_settings (setting_key, setting_value, description, category)
VALUES
('bhs.turnaround.max_minutes', '45', 'Maximum permissible minutes from check-in to aircraft ramp before flagging delayed', 'DISPATCH'),
('bhs.security.divert_threshold', '0.85', 'Optical/EDS anomaly confidence score threshold to trigger CTX Level 2 diversion', 'SECURITY'),
('bhs.sorting.speed_meters_sec', '2.5', 'Main sorter core cross-belt nominal linear conveyor speed', 'TELEMETRY'),
('bhs.auto_reroute.enabled', 'true', 'Automatically recalculate shortest graph path when conveyor junction is degraded', 'ROUTING')
ON CONFLICT (setting_key) DO NOTHING;

-- Augment friend's existing BAG1001 record in baggage to link to AI202
UPDATE baggage 
SET flight_id = 7, 
    passenger_pnr = 'PNRAI2', 
    origin_iata = 'MAA', 
    destination_iata = 'DEL', 
    weight_kg = 18.00, 
    current_handling_point_id = 'MAA-CHECKIN-01'
WHERE baggage_tag = 'BAG1001' AND (flight_id IS NULL OR passenger_pnr IS NULL);

-- Seed initial movement history for friend's existing BAG1001 so it has movement tracking
INSERT INTO baggage_movement_history (baggage_id, baggage_tag, handling_point_id, status_before, status_after, scanner_id, scan_type, operator_username, recorded_at, notes)
SELECT b.id, b.baggage_tag, 'MAA-CHECKIN-01', 'REGISTERED', 'CHECKED_IN', 'SCN-MAA-CK01', 'FIXED_BARCODE', 'handler1', b.created_at, 'Initial passenger check-in recorded at Terminal 1'
FROM baggage b
WHERE b.baggage_tag = 'BAG1001'
  AND NOT EXISTS (SELECT 1 FROM baggage_movement_history WHERE baggage_tag = 'BAG1001');

-- Seed operational baggage records
INSERT INTO baggage (baggage_tag, flight_id, passenger_name, passenger_pnr, origin_iata, destination_iata, weight_kg, current_status, current_handling_point_id, last_scan_time, is_delayed, is_misrouted, is_rush)
VALUES
('MAA6E008912', 1, 'Venkat Krishnan', 'PNR981A', 'MAA', 'DEL', 18.5, 'LOADED', 'MAA-LOADING-01', CURRENT_TIMESTAMP - INTERVAL '15 min', FALSE, FALSE, FALSE),
('MAA6E008913', 1, 'Saravanan Selvam', 'PNR981B', 'MAA', 'DEL', 21.0, 'READY_FOR_LOADING', 'MAA-LOADING-01', CURRENT_TIMESTAMP - INTERVAL '25 min', FALSE, FALSE, FALSE),
('MAAAI004120', 2, 'Meenakshi Sundaram', 'PNR442C', 'MAA', 'BOM', 15.2, 'SORTED', 'MAA-SORTING-01', CURRENT_TIMESTAMP - INTERVAL '30 min', FALSE, FALSE, FALSE),
('MAAAI004121', 2, 'Lakshmi Narayanan', 'PNR442D', 'MAA', 'BOM', 22.8, 'SECURITY_CLEARED', 'MAA-SECURITY-01', CURRENT_TIMESTAMP - INTERVAL '40 min', FALSE, FALSE, FALSE),
('MAAEK009255', 3, 'Rajesh Kumar', 'PNR551E', 'MAA', 'DXB', 28.4, 'CHECKED_IN', 'MAA-CHECKIN-01', CURRENT_TIMESTAMP - INTERVAL '50 min', FALSE, FALSE, FALSE),
('MAASQ001889', 4, 'Divya Balaji', 'PNR339F', 'MAA', 'SIN', 19.1, 'REGISTERED', 'MAA-CHECKIN-01', CURRENT_TIMESTAMP - INTERVAL '65 min', FALSE, FALSE, FALSE),
('MAAINB00711', 5, 'Arun Prakash', 'PNR711G', 'BLR', 'MAA', 14.5, 'DELIVERED_TO_BELT', 'MAA-CLAIM-01', CURRENT_TIMESTAMP - INTERVAL '10 min', FALSE, FALSE, FALSE),
('MAAEXP00099', 1, 'Suresh Kannan', 'PNR999X', 'MAA', 'DEL', 24.0, 'EXCEPTION', 'MAA-SECURITY-02', CURRENT_TIMESTAMP - INTERVAL '45 min', TRUE, FALSE, FALSE)
ON CONFLICT (baggage_tag) DO NOTHING;

-- Seed history for MAA6E008912
INSERT INTO baggage_movement_history (baggage_id, baggage_tag, handling_point_id, previous_point_id, status_before, status_after, scanner_id, scan_type, operator_username, recorded_at, notes)
SELECT b.id, 'MAA6E008912', 'MAA-CHECKIN-01', NULL, 'REGISTERED', 'CHECKED_IN', 'SCN-MAA-CK01', 'FIXED_BARCODE', 'handler1', CURRENT_TIMESTAMP - INTERVAL '80 min', 'Initial passenger check-in verified at Desk 14'
FROM baggage b WHERE b.baggage_tag = 'MAA6E008912'
AND NOT EXISTS (SELECT 1 FROM baggage_movement_history WHERE baggage_tag = 'MAA6E008912');

-- Seed exception for MAAEXP00099
INSERT INTO baggage_exceptions (baggage_id, baggage_tag, exception_type, severity, description, handling_point_id, status, reported_at)
SELECT b.id, 'MAAEXP00099', 'SECURITY_REJECT', 'HIGH', 'Automated EDS Level 1 flagged dense organic material. Diverted to CTX Level 2 inspection.', 'MAA-SECURITY-02', 'OPEN', CURRENT_TIMESTAMP - INTERVAL '45 min'
FROM baggage b WHERE b.baggage_tag = 'MAAEXP00099'
AND NOT EXISTS (SELECT 1 FROM baggage_exceptions WHERE baggage_tag = 'MAAEXP00099');

-- Advance sequences
SELECT setval('baggage_id_auto_seq', GREATEST(COALESCE((SELECT MAX(id) FROM baggage), 1), 10));
SELECT setval('baggage_baggage_id_seq', GREATEST(COALESCE((SELECT MAX(baggage_id) FROM baggage), 1), 10));

-- ==============================================================================
-- 14. DEDICATED ANALYTICAL WAREHOUSE SCHEMA: cargoflight_dw
-- ==============================================================================
CREATE SCHEMA IF NOT EXISTS cargoflight_dw;

CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_terminal (
    terminal_key VARCHAR(8) PRIMARY KEY,
    airport_code VARCHAR(3) NOT NULL,
    terminal_name VARCHAR(64) NOT NULL,
    total_gates INT NOT NULL DEFAULT 20,
    is_international BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_handling_point (
    point_key VARCHAR(32) PRIMARY KEY,
    point_name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    zone VARCHAR(64) NOT NULL,
    capacity_per_hour INT NOT NULL
);

CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_flight (
    flight_key VARCHAR(16) PRIMARY KEY,
    airline_code VARCHAR(4) NOT NULL,
    airline_name VARCHAR(64) NOT NULL,
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    scheduled_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    terminal_key VARCHAR(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_baggage_status (
    status_key VARCHAR(32) PRIMARY KEY,
    stage_category VARCHAR(32) NOT NULL,
    is_terminal_state BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_baggage_lifecycle (
    fact_id BIGSERIAL PRIMARY KEY,
    baggage_tag VARCHAR(32) NOT NULL UNIQUE,
    flight_key VARCHAR(16) NOT NULL,
    current_status_key VARCHAR(32) NOT NULL,
    checkin_time TIMESTAMP WITH TIME ZONE,
    security_time TIMESTAMP WITH TIME ZONE,
    sorted_time TIMESTAMP WITH TIME ZONE,
    loaded_time TIMESTAMP WITH TIME ZONE,
    arrived_time TIMESTAMP WITH TIME ZONE,
    delivered_time TIMESTAMP WITH TIME ZONE,
    claimed_time TIMESTAMP WITH TIME ZONE,
    total_dwell_minutes INT DEFAULT 0,
    is_delayed BOOLEAN NOT NULL DEFAULT FALSE,
    is_misrouted BOOLEAN NOT NULL DEFAULT FALSE,
    is_rush BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_flight_baggage_performance (
    flight_key VARCHAR(16) PRIMARY KEY,
    terminal_key VARCHAR(8) NOT NULL,
    total_expected_bags INT NOT NULL DEFAULT 0,
    total_loaded_bags INT NOT NULL DEFAULT 0,
    load_completion_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.0,
    flight_status VARCHAR(32) NOT NULL,
    last_aggregated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_handling_scans (
    fact_id BIGSERIAL PRIMARY KEY,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    baggage_tag VARCHAR(32) NOT NULL,
    point_key VARCHAR(32) NOT NULL,
    scanner_id VARCHAR(32),
    scan_type VARCHAR(32),
    operator_username VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS cargoflight_dw.warehouse_refresh_log (
    refresh_batch_id VARCHAR(64) PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_ms INT NOT NULL,
    dimensions_refreshed INT NOT NULL DEFAULT 0,
    facts_inserted INT NOT NULL DEFAULT 0,
    facts_updated INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    triggered_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM'
);

-- Warehouse Dimensions Seed
INSERT INTO cargoflight_dw.dim_terminal (terminal_key, airport_code, terminal_name, total_gates, is_international)
VALUES
('T1', 'MAA', 'Terminal 1 Kamaraj Domestic', 18, FALSE),
('T2', 'MAA', 'Terminal 2 Integrated International', 32, TRUE),
('T4', 'MAA', 'Terminal 4 New Domestic Wing', 24, FALSE)
ON CONFLICT (terminal_key) DO NOTHING;

INSERT INTO cargoflight_dw.dim_baggage_status (status_key, stage_category, is_terminal_state, sort_order)
VALUES
('REGISTERED', 'PRE_INDUCTION', FALSE, 1),
('CHECKED_IN', 'INDUCTION', FALSE, 2),
('SECURITY_CLEARED', 'SECURITY', FALSE, 3),
('SECURITY_HELD', 'SECURITY', FALSE, 4),
('SORTED', 'SORTING', FALSE, 5),
('IN_TRANSIT', 'CONVEYANCE', FALSE, 6),
('READY_FOR_LOADING', 'MAKEUP', FALSE, 7),
('LOADED', 'RAMP', FALSE, 8),
('ARRIVED', 'INBOUND', FALSE, 9),
('DELIVERED_TO_BELT', 'RECLAIM', FALSE, 10),
('CLAIMED', 'COMPLETED', TRUE, 11),
('EXCEPTION', 'IRREGULARITY', FALSE, 99)
ON CONFLICT (status_key) DO NOTHING;

INSERT INTO cargoflight_dw.dim_handling_point (point_key, point_name, category, zone, capacity_per_hour)
SELECT id, name, category, zone, capacity_per_hour FROM public.handling_points
ON CONFLICT (point_key) DO NOTHING;

INSERT INTO cargoflight_dw.dim_flight (flight_key, airline_code, airline_name, origin_iata, destination_iata, scheduled_departure, terminal_key)
SELECT flight_number, airline_code, airline_name, origin_iata, destination_iata, scheduled_departure, terminal
FROM public.flights
ON CONFLICT (flight_key) DO NOTHING;

-- Populate OLAP views
CREATE OR REPLACE VIEW cargoflight_dw.v_olap_flight_performance AS
SELECT
    f.flight_key,
    f.airline_name,
    f.origin_iata || ' -> ' || f.destination_iata AS route,
    fp.terminal_key,
    fp.total_expected_bags,
    fp.total_loaded_bags,
    fp.load_completion_percent,
    fp.flight_status
FROM cargoflight_dw.fact_flight_baggage_performance fp
JOIN cargoflight_dw.dim_flight f ON fp.flight_key = f.flight_key;

CREATE OR REPLACE VIEW cargoflight_dw.v_olap_hourly_throughput AS
SELECT
    TO_CHAR(s.event_time, 'HH24:00') AS hour_interval,
    COUNT(s.fact_id) AS scan_event_count,
    COUNT(DISTINCT s.baggage_tag) AS unique_bags_scanned
FROM cargoflight_dw.fact_handling_scans s
GROUP BY TO_CHAR(s.event_time, 'HH24:00')
ORDER BY hour_interval ASC;

-- Initial warehouse refresh log entry
INSERT INTO cargoflight_dw.warehouse_refresh_log (
    refresh_batch_id, started_at, completed_at, duration_ms,
    dimensions_refreshed, facts_inserted, facts_updated, status, triggered_by
)
VALUES (
    'INIT-CARGOFLIGHT-001', CURRENT_TIMESTAMP - INTERVAL '1 min', CURRENT_TIMESTAMP, 350,
    4, 8, 0, 'SUCCESS', 'CargoflightDatabaseSwitch'
)
ON CONFLICT (refresh_batch_id) DO NOTHING;

-- Flyway Schema History Baseline
CREATE TABLE IF NOT EXISTS public.flyway_schema_history (
    installed_rank INT NOT NULL,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success BOOLEAN NOT NULL,
    CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank)
);

INSERT INTO public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES
(1, '1', 'initial schema', 'SQL', 'V1__initial_schema.sql', 368767799, 'aerotrace_app', 46, TRUE),
(2, '2', 'seed maa data', 'SQL', 'V2__seed_maa_data.sql', -1163881241, 'aerotrace_app', 13, TRUE),
(3, '3', 'warehouse olap schema', 'SQL', 'V3__warehouse_olap_schema.sql', -1547882591, 'aerotrace_app', 39, TRUE)
ON CONFLICT (installed_rank) DO NOTHING;

-- Grant all permissions to both postgres and aerotrace_app
GRANT ALL ON SCHEMA public TO aerotrace_app, postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aerotrace_app, postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aerotrace_app, postgres;
GRANT ALL ON SCHEMA cargoflight_dw TO aerotrace_app, postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cargoflight_dw TO aerotrace_app, postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cargoflight_dw TO aerotrace_app, postgres;
