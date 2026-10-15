-- ==============================================================================
-- CARGOFLIGHT - Flyway Migration V3__warehouse_olap_schema.sql
-- 1. PostgreSQL Data Warehouse OLAP Dimensional Schema (cargoflight_dw)
-- 2. Operational System Settings Table
-- 3. Genuine BCrypt Hash Update for Seed Users
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: Operational System Settings Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'OPERATIONAL',
    description VARCHAR(255) NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system'
);

INSERT INTO system_settings (setting_key, setting_value, category, description, updated_by)
VALUES
('airport_code', 'MAA', 'OPERATIONAL', 'Authoritative airport IATA code', 'system'),
('airport_name', 'Chennai International Airport', 'OPERATIONAL', 'Full facility name', 'system'),
('default_terminal', 'T2', 'OPERATIONAL', 'Primary operations terminal', 'system'),
('timezone', 'Asia/Kolkata', 'SYSTEM', 'Standard operational timezone (IST)', 'system'),
('date_format', 'DD/MM/YYYY', 'SYSTEM', 'Display date format standard', 'system'),
('baggage_delay_threshold_minutes', '45', 'OPERATIONAL', 'Minutes before inactive bag marked delayed', 'system'),
('auto_refresh_seconds', '30', 'PREFERENCE', 'Dashboard polling interval', 'system'),
('mysql_sync_interval_minutes', '15', 'DATABASE', 'Secondary mirror sync schedule', 'system'),
('theme_mode', 'LIGHT', 'PREFERENCE', 'Application visual theme mode', 'system'),
('audit_retention_days', '90', 'SECURITY', 'Compliance audit log retention policy', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- PART 2: Update legacy placeholder password hashes to authentic BCrypt hashes
-- Password: Aerotrace@2026
-- ------------------------------------------------------------------------------
UPDATE users 
SET password_hash = '$2a$10$kmGarv//tCCNP/jyNhTV8uWekJ5AzkfW/8nWPSqxvj3YQ9y6ujAbu'
WHERE password_hash = '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De';

-- ------------------------------------------------------------------------------
-- PART 3: PostgreSQL Data Warehouse Dimensional Schema
-- Schema: cargoflight_dw
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS cargoflight_dw;

-- 1. Dim Terminal
CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_terminal (
    terminal_key VARCHAR(16) PRIMARY KEY,
    terminal_name VARCHAR(64) NOT NULL,
    airport_code VARCHAR(3) NOT NULL DEFAULT 'MAA',
    total_gates INT NOT NULL DEFAULT 12,
    total_conveyors INT NOT NULL DEFAULT 6,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Dim Flight
CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_flight (
    flight_key VARCHAR(32) PRIMARY KEY,
    airline_code VARCHAR(8) NOT NULL,
    airline_name VARCHAR(64) NOT NULL,
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    terminal VARCHAR(8) NOT NULL,
    gate VARCHAR(16) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Dim Handling Point
CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_handling_point (
    point_key VARCHAR(32) PRIMARY KEY,
    point_name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    zone VARCHAR(64) NOT NULL,
    capacity_per_hour INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Dim Baggage Status
CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_baggage_status (
    status_key VARCHAR(32) PRIMARY KEY,
    stage_name VARCHAR(64) NOT NULL,
    stage_category VARCHAR(32) NOT NULL,
    is_terminal_state BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. Fact Baggage Lifecycle (Dimensional Accumulating Snapshot Fact Table)
CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_baggage_lifecycle (
    fact_id BIGSERIAL PRIMARY KEY,
    baggage_tag VARCHAR(32) NOT NULL UNIQUE,
    flight_key VARCHAR(32) REFERENCES cargoflight_dw.dim_flight(flight_key),
    terminal_key VARCHAR(16) REFERENCES cargoflight_dw.dim_terminal(terminal_key),
    current_status_key VARCHAR(32) REFERENCES cargoflight_dw.dim_baggage_status(status_key),
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    weight_kg DECIMAL(5, 2) NOT NULL,
    total_scans INT NOT NULL DEFAULT 0,
    total_duration_minutes INT NOT NULL DEFAULT 0,
    is_delayed BOOLEAN NOT NULL DEFAULT FALSE,
    is_misrouted BOOLEAN NOT NULL DEFAULT FALSE,
    first_scan_at TIMESTAMP WITH TIME ZONE NULL,
    last_scan_at TIMESTAMP WITH TIME ZONE NULL,
    dw_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dw_fact_tag ON cargoflight_dw.fact_baggage_lifecycle(baggage_tag);
CREATE INDEX IF NOT EXISTS idx_dw_fact_flight ON cargoflight_dw.fact_baggage_lifecycle(flight_key);
CREATE INDEX IF NOT EXISTS idx_dw_fact_status ON cargoflight_dw.fact_baggage_lifecycle(current_status_key);
CREATE INDEX IF NOT EXISTS idx_dw_fact_terminal ON cargoflight_dw.fact_baggage_lifecycle(terminal_key);

-- 6. Fact Handling Scans (Transaction Grain Fact Table)
CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_handling_scans (
    fact_id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL UNIQUE,
    baggage_tag VARCHAR(32) NOT NULL,
    point_key VARCHAR(32) REFERENCES cargoflight_dw.dim_handling_point(point_key),
    status_after_key VARCHAR(32) REFERENCES cargoflight_dw.dim_baggage_status(status_key),
    scan_type VARCHAR(32) NOT NULL,
    scanner_id VARCHAR(32) NULL,
    operator_username VARCHAR(64) NOT NULL DEFAULT 'system',
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    dw_loaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dw_scan_tag ON cargoflight_dw.fact_handling_scans(baggage_tag);
CREATE INDEX IF NOT EXISTS idx_dw_scan_point ON cargoflight_dw.fact_handling_scans(point_key);
CREATE INDEX IF NOT EXISTS idx_dw_scan_time ON cargoflight_dw.fact_handling_scans(event_time);

-- 7. Fact Flight Baggage Performance (Periodic Snapshot Fact Table)
CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_flight_baggage_performance (
    fact_id BIGSERIAL PRIMARY KEY,
    flight_key VARCHAR(32) NOT NULL UNIQUE,
    terminal_key VARCHAR(16) REFERENCES cargoflight_dw.dim_terminal(terminal_key),
    scheduled_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    total_expected_bags INT NOT NULL DEFAULT 0,
    total_loaded_bags INT NOT NULL DEFAULT 0,
    load_completion_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    flight_status VARCHAR(32) NOT NULL,
    dw_refreshed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Warehouse Refresh Log
CREATE TABLE IF NOT EXISTS cargoflight_dw.warehouse_refresh_log (
    id BIGSERIAL PRIMARY KEY,
    refresh_batch_id VARCHAR(64) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    duration_ms BIGINT NULL,
    dimensions_refreshed INT NOT NULL DEFAULT 0,
    facts_inserted INT NOT NULL DEFAULT 0,
    facts_updated INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL, -- SUCCESS, FAILED
    error_message TEXT NULL,
    triggered_by VARCHAR(64) NOT NULL DEFAULT 'system'
);

-- ------------------------------------------------------------------------------
-- PART 4: Seed Dimensions in Data Warehouse
-- ------------------------------------------------------------------------------

-- Terminals
INSERT INTO cargoflight_dw.dim_terminal (terminal_key, terminal_name, airport_code, total_gates, total_conveyors)
VALUES
('T1', 'Terminal 1 Domestic Old', 'MAA', 10, 4),
('T2', 'Terminal 2 Integrated Passenger Terminal', 'MAA', 24, 12),
('T3', 'Terminal 3 International Arrivals', 'MAA', 14, 8),
('CARGO', 'Air Cargo Complex Ramp & Freight Staging', 'MAA', 6, 6)
ON CONFLICT (terminal_key) DO NOTHING;

-- Baggage Status Dimension
INSERT INTO cargoflight_dw.dim_baggage_status (status_key, stage_name, stage_category, is_terminal_state)
VALUES
('REGISTERED', 'Manifest Registered', 'INTAKE', FALSE),
('CHECKED_IN', 'Checked In at Desk', 'INTAKE', FALSE),
('SECURITY_CLEARED', 'Security Screening Cleared', 'SCREENING', FALSE),
('SECURITY_HELD', 'Security Inspection Diverted', 'SCREENING', FALSE),
('SORTED', 'Automated Sorter Routed', 'SORTING', FALSE),
('IN_TRANSIT', 'Conveyor Inter-Pier Transport', 'TRANSPORT', FALSE),
('READY_FOR_LOADING', 'Pier Ramp Staging', 'RAMP', FALSE),
('LOADED', 'Loaded on Aircraft Hold', 'TRANSIT', FALSE),
('ARRIVED', 'Aircraft Inbound Induction', 'ARRIVAL', FALSE),
('DELIVERED_TO_BELT', 'Delivered to Reclaim Belt', 'CLAIM', FALSE),
('CLAIMED', 'Passenger Collected & Reclaimed', 'CLAIM', TRUE),
('EXCEPTION', 'Operational Exception Flagged', 'EXCEPTION', FALSE)
ON CONFLICT (status_key) DO NOTHING;

-- Handling Points Dimension (Populated from operational handling points)
INSERT INTO cargoflight_dw.dim_handling_point (point_key, point_name, category, zone, capacity_per_hour)
SELECT id, name, category, zone, capacity_per_hour
FROM handling_points
ON CONFLICT (point_key) DO NOTHING;

-- Flights Dimension (Populated from operational flights)
INSERT INTO cargoflight_dw.dim_flight (flight_key, airline_code, airline_name, origin_iata, destination_iata, terminal, gate)
SELECT flight_number, airline_code, airline_name, origin_iata, destination_iata, terminal, gate
FROM flights
ON CONFLICT (flight_key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- PART 5: Initial Population of Warehouse Fact Tables
-- ------------------------------------------------------------------------------

-- Populate Fact Baggage Lifecycle
INSERT INTO cargoflight_dw.fact_baggage_lifecycle (
    baggage_tag, flight_key, terminal_key, current_status_key,
    origin_iata, destination_iata, weight_kg,
    is_delayed, is_misrouted, first_scan_at, last_scan_at
)
SELECT 
    b.baggage_tag,
    f.flight_number,
    COALESCE(f.terminal, 'T2'),
    b.current_status,
    b.origin_iata,
    b.destination_iata,
    b.weight_kg,
    b.is_delayed,
    b.is_misrouted,
    b.registered_at,
    b.last_scan_time
FROM baggage b
LEFT JOIN flights f ON b.flight_id = f.id
ON CONFLICT (baggage_tag) DO UPDATE SET
    current_status_key = EXCLUDED.current_status_key,
    is_delayed = EXCLUDED.is_delayed,
    is_misrouted = EXCLUDED.is_misrouted,
    last_scan_at = EXCLUDED.last_scan_at,
    dw_updated_at = CURRENT_TIMESTAMP;

-- Populate Fact Handling Scans
INSERT INTO cargoflight_dw.fact_handling_scans (
    event_id, baggage_tag, point_key, status_after_key,
    scan_type, scanner_id, operator_username, event_time
)
SELECT
    'EVT-' || m.id,
    m.baggage_tag,
    m.handling_point_id,
    m.status_after,
    m.scan_type,
    m.scanner_id,
    m.operator_username,
    m.recorded_at
FROM baggage_movement_history m
ON CONFLICT (event_id) DO NOTHING;

-- Populate Fact Flight Performance
INSERT INTO cargoflight_dw.fact_flight_baggage_performance (
    flight_key, terminal_key, scheduled_departure,
    total_expected_bags, total_loaded_bags, load_completion_percent, flight_status
)
SELECT
    flight_number,
    COALESCE(terminal, 'T2'),
    scheduled_departure,
    total_expected_bags,
    total_loaded_bags,
    CASE WHEN total_expected_bags > 0 
         THEN ROUND((total_loaded_bags::numeric / total_expected_bags::numeric) * 100.0, 2)
         ELSE 0.00 END,
    status
FROM flights
ON CONFLICT (flight_key) DO UPDATE SET
    total_expected_bags = EXCLUDED.total_expected_bags,
    total_loaded_bags = EXCLUDED.total_loaded_bags,
    load_completion_percent = EXCLUDED.load_completion_percent,
    flight_status = EXCLUDED.flight_status,
    dw_refreshed_at = CURRENT_TIMESTAMP;

-- ------------------------------------------------------------------------------
-- PART 6: OLAP Analytical Views
-- ------------------------------------------------------------------------------

-- View 1: Baggage Volume by Terminal
CREATE OR REPLACE VIEW cargoflight_dw.v_olap_volume_by_terminal AS
SELECT 
    t.terminal_key,
    t.terminal_name,
    COUNT(b.fact_id) AS total_bags_processed,
    SUM(CASE WHEN b.current_status_key = 'LOADED' THEN 1 ELSE 0 END) AS bags_loaded,
    SUM(CASE WHEN b.is_delayed = TRUE THEN 1 ELSE 0 END) AS bags_delayed,
    SUM(CASE WHEN b.is_misrouted = TRUE THEN 1 ELSE 0 END) AS bags_misrouted,
    ROUND(AVG(b.weight_kg), 2) AS avg_baggage_weight_kg
FROM cargoflight_dw.dim_terminal t
LEFT JOIN cargoflight_dw.fact_baggage_lifecycle b ON t.terminal_key = b.terminal_key
GROUP BY t.terminal_key, t.terminal_name;

-- View 2: Handling Duration & Scan Performance by Stage
CREATE OR REPLACE VIEW cargoflight_dw.v_olap_duration_by_stage AS
SELECT
    p.point_key,
    p.point_name,
    p.category AS checkpoint_category,
    p.zone,
    COUNT(s.fact_id) AS total_scans_recorded,
    COUNT(DISTINCT s.baggage_tag) AS unique_bags_handled
FROM cargoflight_dw.dim_handling_point p
LEFT JOIN cargoflight_dw.fact_handling_scans s ON p.point_key = s.point_key
GROUP BY p.point_key, p.point_name, p.category, p.zone;

-- View 3: Flight Baggage Performance
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

-- View 4: Hourly Ingestion Throughput
CREATE OR REPLACE VIEW cargoflight_dw.v_olap_hourly_throughput AS
SELECT
    TO_CHAR(s.event_time, 'HH24:00') AS hour_interval,
    COUNT(s.fact_id) AS scan_event_count,
    COUNT(DISTINCT s.baggage_tag) AS unique_bags_scanned
FROM cargoflight_dw.fact_handling_scans s
GROUP BY TO_CHAR(s.event_time, 'HH24:00')
ORDER BY hour_interval ASC;

-- Initial refresh log entry
INSERT INTO cargoflight_dw.warehouse_refresh_log (
    refresh_batch_id, started_at, completed_at, duration_ms,
    dimensions_refreshed, facts_inserted, facts_updated, status, triggered_by
)
VALUES (
    'INIT-BATCH-001', CURRENT_TIMESTAMP - INTERVAL '1 min', CURRENT_TIMESTAMP, 450,
    4, 8, 0, 'SUCCESS', 'FlywayMigrationV3'
);
