-- ==============================================================================
-- AEROTRACE MAA - PostgreSQL Database Initial Schema
-- Primary Operational Database: aerotrace_india
-- Flyway Migration V1__initial_schema.sql
-- ==============================================================================

-- 1. Airport Configuration (Authoritative Single-Airport Scope: MAA)
CREATE TABLE airports (
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

-- 2. Flights Schedule and Baggage Allocation
CREATE TABLE flights (
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
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, BOARDING, DEPARTED, IN_FLIGHT, ARRIVED, DELAYED, CANCELLED
    total_expected_bags INT NOT NULL DEFAULT 0,
    total_loaded_bags INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_flight_direction CHECK (origin_iata = 'MAA' OR destination_iata = 'MAA')
);

CREATE INDEX idx_flights_num ON flights (flight_number);
CREATE INDEX idx_flights_departure ON flights (scheduled_departure);
CREATE INDEX idx_flights_status ON flights (status);

-- 3. Handling Points (Physical and Logical BHS checkpoints at MAA)
CREATE TABLE handling_points (
    id VARCHAR(32) PRIMARY KEY, -- e.g. MAA-CHECKIN-01
    airport_code VARCHAR(3) NOT NULL REFERENCES airports(code),
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL, -- CHECK_IN, SECURITY, SORTING, CONVEYOR, TRANSFER, LOADING, ARRIVAL, CLAIM
    zone VARCHAR(64) NOT NULL, -- TERMINAL_2_LEVEL_1, BHS_BASEMENT_ZONE_A, etc.
    operational_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DEGRADED, MAINTENANCE, OFFLINE
    capacity_per_hour INT NOT NULL DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_handling_points_cat ON handling_points (category);
CREATE INDEX idx_handling_points_status ON handling_points (operational_status);

-- 4. Handling Point Connections (Logical routing topology at MAA)
CREATE TABLE handling_point_connections (
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

CREATE INDEX idx_connections_from ON handling_point_connections (from_point_id);
CREATE INDEX idx_connections_to ON handling_point_connections (to_point_id);

-- 5. Scanner Devices (Fixed barcodes/RFID readers and mobile handhelds)
CREATE TABLE scanner_devices (
    id VARCHAR(32) PRIMARY KEY, -- e.g. SCN-MAA-CK-01
    handling_point_id VARCHAR(32) NOT NULL REFERENCES handling_points(id),
    device_type VARCHAR(32) NOT NULL, -- FIXED_BARCODE, FIXED_RFID, MOBILE_TERMINAL, OPTICAL_VOLUME
    model VARCHAR(64) NOT NULL,
    serial_number VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ONLINE', -- ONLINE, DEGRADED, OFFLINE
    last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scanners_point ON scanner_devices (handling_point_id);

-- 6. Authoritative Baggage Master Record
CREATE TABLE baggage (
    id BIGSERIAL PRIMARY KEY,
    baggage_tag VARCHAR(32) NOT NULL UNIQUE, -- IATA 10-digit standard or airline prefix
    flight_id BIGINT NOT NULL REFERENCES flights(id),
    passenger_name VARCHAR(128) NOT NULL,
    passenger_pnr VARCHAR(16) NOT NULL,
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    weight_kg DECIMAL(5, 2) NOT NULL,
    current_status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED',
    -- Stages: REGISTERED, CHECKED_IN, SECURITY_CLEARED, SECURITY_HELD, SORTED, IN_TRANSIT, READY_FOR_LOADING, LOADED, ARRIVED, DELIVERED_TO_BELT, CLAIMED, EXCEPTION
    current_handling_point_id VARCHAR(32) NULL REFERENCES handling_points(id),
    last_scan_time TIMESTAMP WITH TIME ZONE NULL,
    is_delayed BOOLEAN NOT NULL DEFAULT FALSE,
    is_misrouted BOOLEAN NOT NULL DEFAULT FALSE,
    is_rush BOOLEAN NOT NULL DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_baggage_tag ON baggage (baggage_tag);
CREATE INDEX idx_baggage_flight ON baggage (flight_id);
CREATE INDEX idx_baggage_status ON baggage (current_status);
CREATE INDEX idx_baggage_point ON baggage (current_handling_point_id);
CREATE INDEX idx_baggage_pnr ON baggage (passenger_pnr);

-- 7. Append-Only Baggage Movement History (Audit-compliant immutable event log)
CREATE TABLE baggage_movement_history (
    id BIGSERIAL PRIMARY KEY,
    baggage_id BIGINT NOT NULL REFERENCES baggage(id) ON DELETE CASCADE,
    baggage_tag VARCHAR(32) NOT NULL,
    handling_point_id VARCHAR(32) NOT NULL REFERENCES handling_points(id),
    previous_point_id VARCHAR(32) NULL REFERENCES handling_points(id),
    status_before VARCHAR(32) NOT NULL,
    status_after VARCHAR(32) NOT NULL,
    scanner_id VARCHAR(32) NULL,
    scan_type VARCHAR(32) NOT NULL DEFAULT 'SIMULATED_OPTICAL', -- MANUAL_ENTRY, SIMULATED_OPTICAL, RFID_GATE
    operator_username VARCHAR(64) NOT NULL DEFAULT 'system',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL
);

CREATE INDEX idx_history_baggage_id ON baggage_movement_history (baggage_id);
CREATE INDEX idx_history_baggage_tag ON baggage_movement_history (baggage_tag);
CREATE INDEX idx_history_point ON baggage_movement_history (handling_point_id);
CREATE INDEX idx_history_recorded ON baggage_movement_history (recorded_at);

-- 8. Baggage Exceptions (Operational irregularities & investigations)
CREATE TABLE baggage_exceptions (
    id BIGSERIAL PRIMARY KEY,
    baggage_id BIGINT NOT NULL REFERENCES baggage(id) ON DELETE CASCADE,
    baggage_tag VARCHAR(32) NOT NULL,
    exception_type VARCHAR(32) NOT NULL, -- SECURITY_REJECT, MISROUTED, CONVEYOR_JAM, OVERSIZED_MANUAL, UNKNOWN_TAG, TAG_DAMAGED
    severity VARCHAR(16) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT NOT NULL,
    handling_point_id VARCHAR(32) NOT NULL REFERENCES handling_points(id),
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_INVESTIGATION, RESOLVED, DISMISSED
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    resolved_by VARCHAR(64) NULL,
    resolution_notes TEXT NULL
);

CREATE INDEX idx_exceptions_tag ON baggage_exceptions (baggage_tag);
CREATE INDEX idx_exceptions_status ON baggage_exceptions (status);
CREATE INDEX idx_exceptions_severity ON baggage_exceptions (severity);

-- 9. Users and Role-Based Access Control
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL, -- SYSTEM_ADMIN, OPERATIONS_MANAGER, BAGGAGE_HANDLER, SECURITY_OFFICER, ANALYST, DATABASE_ADMIN, VIEWER
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role ON users (role);

-- 10. System Audit Log (Track security-sensitive actions and operational configurations)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL, -- USER_LOGIN, BAGGAGE_REGISTERED, ROUTE_CONNECTION_BLOCKED, EXCEPTION_RESOLVED, etc.
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_created ON audit_logs (created_at);
CREATE INDEX idx_audit_user ON audit_logs (username);
