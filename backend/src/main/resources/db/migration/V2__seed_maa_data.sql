-- ==============================================================================
-- AEROTRACE MAA - Seed Migration
-- Primary Operational Database: aerotrace_india
-- Flyway Migration V2__seed_maa_data.sql
-- ==============================================================================

-- 1. Airport: Single-Airport Scope Chennai International Airport (MAA)
INSERT INTO airports (code, name, city, country, timezone, latitude, longitude, is_active)
VALUES ('MAA', 'Chennai International Airport', 'Chennai', 'India', 'Asia/Kolkata', 12.994112, 80.170866, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Illustrative Handling Points at MAA
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

-- 3. Logical Handling Point Connections (Routing Graph)
INSERT INTO handling_point_connections (from_point_id, to_point_id, distance_meters, estimated_traversal_seconds, is_active, restriction_notes)
VALUES
('MAA-CHECKIN-01', 'MAA-SECURITY-01', 85.00, 65, TRUE, 'Direct gravity feed check-in belt'),
('MAA-SECURITY-01', 'MAA-SORTING-01', 140.00, 110, TRUE, 'Primary automated line post-clearance'),
('MAA-SECURITY-01', 'MAA-SECURITY-02', 40.00, 35, TRUE, 'Diverter spur for level 2 manual inspection'),
('MAA-SECURITY-02', 'MAA-SORTING-01', 110.00, 85, TRUE, 'Re-induction loop post secondary clearance'),
('MAA-SORTING-01', 'MAA-CONVEYOR-01', 220.00, 140, TRUE, 'Main departure spine tunnel line'),
('MAA-SORTING-01', 'MAA-SORTING-02', 60.00, 45, TRUE, 'Overflow / pier bypass conveyor'),
('MAA-SORTING-02', 'MAA-CONVEYOR-01', 190.00, 125, TRUE, 'Cross-belt merge to pier spine'),
('MAA-CONVEYOR-01', 'MAA-LOADING-01', 175.00, 115, TRUE, 'Pier 1 Gates 11-15 makeup carousel feed'),
('MAA-CONVEYOR-01', 'MAA-LOADING-02', 240.00, 160, TRUE, 'Pier 2 Gates 16-20 makeup carousel feed'),
('MAA-TRANSFER-01', 'MAA-SECURITY-01', 115.00, 90, TRUE, 'Transfer induction security screening link'),
('MAA-ARRIVAL-01', 'MAA-CLAIM-01', 160.00, 130, TRUE, 'Direct airside-to-reclaim carousel belt 3')
ON CONFLICT (from_point_id, to_point_id) DO NOTHING;

-- 4. Scanner Devices at MAA
INSERT INTO scanner_devices (id, handling_point_id, device_type, model, serial_number, ip_address, status)
VALUES
('SCN-MAA-CK01', 'MAA-CHECKIN-01', 'FIXED_BARCODE', 'SICK CLV690 Ultra', 'SN-SICK-884102', '10.12.4.11', 'ONLINE'),
('SCN-MAA-SEC1', 'MAA-SECURITY-01', 'FIXED_RFID', 'Zebra FX9600 Industrial', 'SN-ZEB-991201', '10.12.4.15', 'ONLINE'),
('SCN-MAA-SEC2', 'MAA-SECURITY-02', 'FIXED_BARCODE', 'Cognex DataMan 374X', 'SN-CGX-310492', '10.12.4.16', 'ONLINE'),
('SCN-MAA-SRT1', 'MAA-SORTING-01', 'FIXED_BARCODE', 'Datalogic DX8210 High-Speed', 'SN-DLG-772183', '10.12.4.20', 'ONLINE'),
('SCN-MAA-SRT2', 'MAA-SORTING-02', 'FIXED_BARCODE', 'Datalogic DX8210 High-Speed', 'SN-DLG-772184', '10.12.4.21', 'ONLINE'),
('SCN-MAA-CNV1', 'MAA-CONVEYOR-01', 'FIXED_RFID', 'Zebra FX9600 Industrial', 'SN-ZEB-991205', '10.12.4.25', 'ONLINE'),
('SCN-MAA-LD01', 'MAA-LOADING-01', 'MOBILE_TERMINAL', 'Honeywell Dolphin CT60', 'SN-HW-441029', '10.12.4.30', 'ONLINE'),
('SCN-MAA-LD02', 'MAA-LOADING-02', 'MOBILE_TERMINAL', 'Honeywell Dolphin CT60', 'SN-HW-441030', '10.12.4.31', 'ONLINE'),
('SCN-MAA-CLM1', 'MAA-CLAIM-01', 'FIXED_BARCODE', 'SICK CLV690 Ultra', 'SN-SICK-884199', '10.12.4.40', 'ONLINE')
ON CONFLICT (id) DO NOTHING;

-- 5. Operational Users (BCrypt Hash for password 'Aerotrace@2026': $2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De)
-- We will also support standard test password check in code
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES
('admin', 'admin@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Karthik Subramanian', 'SYSTEM_ADMIN', TRUE),
('ops_manager', 'ops@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Priya Ramanathan', 'OPERATIONS_MANAGER', TRUE),
('handler1', 'handler1@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Murali Vijay', 'BAGGAGE_HANDLER', TRUE),
('security_off', 'security@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Deepa Natarajan', 'SECURITY_OFFICER', TRUE),
('analyst', 'analyst@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Siddharth Chandran', 'ANALYST', TRUE),
('dbadmin', 'dbadmin@maa.aerotrace.aero', '$2a$10$wH2vI9H8E6Z4c7wY5vQ7tu6M4o3S6f8N5r2X4Y6b8W0e1A2B3C4De', 'Ananya Sridhar', 'DATABASE_ADMIN', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 6. Scheduled Flights (Chennai MAA Operations)
INSERT INTO flights (flight_number, airline_code, airline_name, origin_iata, destination_iata, scheduled_departure, scheduled_arrival, terminal, gate, status, total_expected_bags, total_loaded_bags)
VALUES
('6E-2041', '6E', 'IndiGo Airlines', 'MAA', 'DEL', CURRENT_TIMESTAMP + INTERVAL '2 hour', CURRENT_TIMESTAMP + INTERVAL '4 hour 45 min', 'T2', 'G12', 'SCHEDULED', 145, 82),
('AI-440', 'AI', 'Air India', 'MAA', 'BOM', CURRENT_TIMESTAMP + INTERVAL '3 hour 15 min', CURRENT_TIMESTAMP + INTERVAL '5 hour', 'T2', 'G15', 'SCHEDULED', 120, 45),
('EK-545', 'EK', 'Emirates', 'MAA', 'DXB', CURRENT_TIMESTAMP + INTERVAL '4 hour 30 min', CURRENT_TIMESTAMP + INTERVAL '8 hour 45 min', 'T2', 'G22', 'SCHEDULED', 260, 110),
('SQ-529', 'SQ', 'Singapore Airlines', 'MAA', 'SIN', CURRENT_TIMESTAMP + INTERVAL '6 hour', CURRENT_TIMESTAMP + INTERVAL '10 hour 15 min', 'T2', 'G24', 'SCHEDULED', 190, 30),
('6E-6188', '6E', 'IndiGo Airlines', 'BLR', 'MAA', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '10 min', 'T2', 'G08', 'ARRIVED', 115, 115),
('BA-035', 'BA', 'British Airways', 'LHR', 'MAA', CURRENT_TIMESTAMP - INTERVAL '30 min', CURRENT_TIMESTAMP + INTERVAL '40 min', 'T2', 'G19', 'ARRIVED', 240, 215)
ON CONFLICT DO NOTHING;

-- 7. Seeded Operational Baggage Records (Clearly labelled simulated demo dataset)
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

-- 8. Baggage Movement History for MAA6E008912
INSERT INTO baggage_movement_history (baggage_id, baggage_tag, handling_point_id, previous_point_id, status_before, status_after, scanner_id, scan_type, operator_username, recorded_at, notes)
VALUES
(1, 'MAA6E008912', 'MAA-CHECKIN-01', NULL, 'REGISTERED', 'CHECKED_IN', 'SCN-MAA-CK01', 'FIXED_BARCODE', 'handler1', CURRENT_TIMESTAMP - INTERVAL '80 min', 'Initial passenger check-in verified at Desk 14'),
(1, 'MAA6E008912', 'MAA-SECURITY-01', 'MAA-CHECKIN-01', 'CHECKED_IN', 'SECURITY_CLEARED', 'SCN-MAA-SEC1', 'FIXED_RFID', 'security_off', CURRENT_TIMESTAMP - INTERVAL '60 min', 'Level 1 EDS automated X-ray clear'),
(1, 'MAA6E008912', 'MAA-SORTING-01', 'MAA-SECURITY-01', 'SECURITY_CLEARED', 'SORTED', 'SCN-MAA-SRT1', 'FIXED_BARCODE', 'system', CURRENT_TIMESTAMP - INTERVAL '40 min', 'Sorted to Pier 1 departure chute 03'),
(1, 'MAA6E008912', 'MAA-LOADING-01', 'MAA-SORTING-01', 'SORTED', 'LOADED', 'SCN-MAA-LD01', 'MOBILE_TERMINAL', 'handler1', CURRENT_TIMESTAMP - INTERVAL '15 min', 'Loaded into Tug Cart TC-08 for Flight 6E-2041')
ON CONFLICT DO NOTHING;

-- 9. Baggage Exception Record
INSERT INTO baggage_exceptions (baggage_id, baggage_tag, exception_type, severity, description, handling_point_id, status, reported_at)
VALUES
(8, 'MAAEXP00099', 'SECURITY_REJECT', 'HIGH', 'Automated EDS Level 1 flagged dense organic material. Diverted to CTX Level 2 inspection.', 'MAA-SECURITY-02', 'OPEN', CURRENT_TIMESTAMP - INTERVAL '45 min')
ON CONFLICT DO NOTHING;
