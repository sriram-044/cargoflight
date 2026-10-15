package com.aerotrace.maa.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class WarehouseService {

    private static final Logger log = LoggerFactory.getLogger(WarehouseService.class);

    private final JdbcTemplate jdbcTemplate;

    public WarehouseService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public static class WarehouseRefreshResult {
        private String batchId;
        private int dimensionsRefreshed;
        private int factsRefreshed;
        private long durationMs;
        private boolean success;
        private String message;

        public WarehouseRefreshResult(String batchId, int dimensionsRefreshed, int factsRefreshed, long durationMs, boolean success, String message) {
            this.batchId = batchId;
            this.dimensionsRefreshed = dimensionsRefreshed;
            this.factsRefreshed = factsRefreshed;
            this.durationMs = durationMs;
            this.success = success;
            this.message = message;
        }

        public String getBatchId() { return batchId; }
        public int getDimensionsRefreshed() { return dimensionsRefreshed; }
        public int getFactsRefreshed() { return factsRefreshed; }
        public long getDurationMs() { return durationMs; }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    public static class WarehouseStatusDto {
        private boolean initialized;
        private long totalLifecycleFacts;
        private long totalScanFacts;
        private long totalFlightFacts;
        private String lastRefreshedAt;
        private String lastBatchId;
        private String lastStatus;

        public WarehouseStatusDto() {}

        public boolean isInitialized() { return initialized; }
        public void setInitialized(boolean initialized) { this.initialized = initialized; }
        public long getTotalLifecycleFacts() { return totalLifecycleFacts; }
        public void setTotalLifecycleFacts(long totalLifecycleFacts) { this.totalLifecycleFacts = totalLifecycleFacts; }
        public long getTotalScanFacts() { return totalScanFacts; }
        public void setTotalScanFacts(long totalScanFacts) { this.totalScanFacts = totalScanFacts; }
        public long getTotalFlightFacts() { return totalFlightFacts; }
        public void setTotalFlightFacts(long totalFlightFacts) { this.totalFlightFacts = totalFlightFacts; }
        public String getLastRefreshedAt() { return lastRefreshedAt; }
        public void setLastRefreshedAt(String lastRefreshedAt) { this.lastRefreshedAt = lastRefreshedAt; }
        public String getLastBatchId() { return lastBatchId; }
        public void setLastBatchId(String lastBatchId) { this.lastBatchId = lastBatchId; }
        public String getLastStatus() { return lastStatus; }
        public void setLastStatus(String lastStatus) { this.lastStatus = lastStatus; }
    }

    @Transactional
    public WarehouseRefreshResult refreshWarehouse(String operatorUsername) {
        long startTime = System.currentTimeMillis();
        String batchId = "WH-REFRESH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        int dimensionsRefreshed = 0;
        int factsRefreshed = 0;

        try {
            // Check if cargoflight_dw schema exists
            Integer schemaExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'cargoflight_dw'",
                    Integer.class
            );

            if (schemaExists == null || schemaExists == 0) {
                // Ensure schema and tables exist if running on H2 dev mode
                createWarehouseSchemaIfMissing();
            }

            // 1. Refresh Dimensions: dim_handling_point
            int pts = jdbcTemplate.update(
                    "INSERT INTO cargoflight_dw.dim_handling_point (point_key, point_name, category, zone, capacity_per_hour) " +
                    "SELECT id, name, category, zone, capacity_per_hour FROM handling_points " +
                    "ON CONFLICT (point_key) DO UPDATE SET " +
                    "point_name = EXCLUDED.point_name, category = EXCLUDED.category, zone = EXCLUDED.zone, capacity_per_hour = EXCLUDED.capacity_per_hour"
            );
            dimensionsRefreshed += pts;

            // 2. Refresh Dimensions: dim_flight
            int flts = jdbcTemplate.update(
                    "INSERT INTO cargoflight_dw.dim_flight (flight_key, airline_code, airline_name, origin_iata, destination_iata, terminal, gate) " +
                    "SELECT flight_number, airline_code, airline_name, origin_iata, destination_iata, terminal, gate FROM flights " +
                    "ON CONFLICT (flight_key) DO UPDATE SET " +
                    "origin_iata = EXCLUDED.origin_iata, destination_iata = EXCLUDED.destination_iata, terminal = EXCLUDED.terminal, gate = EXCLUDED.gate"
            );
            dimensionsRefreshed += flts;

            // 3. Refresh Facts: fact_baggage_lifecycle (idempotent upsert)
            int lifeFacts = jdbcTemplate.update(
                    "INSERT INTO cargoflight_dw.fact_baggage_lifecycle ( " +
                    "    baggage_tag, flight_key, terminal_key, current_status_key, " +
                    "    origin_iata, destination_iata, weight_kg, " +
                    "    is_delayed, is_misrouted, first_scan_at, last_scan_at " +
                    ") " +
                    "SELECT " +
                    "    b.baggage_tag, " +
                    "    f.flight_number, " +
                    "    COALESCE(f.terminal, 'T2'), " +
                    "    b.current_status, " +
                    "    b.origin_iata, " +
                    "    b.destination_iata, " +
                    "    b.weight_kg, " +
                    "    b.is_delayed, " +
                    "    b.is_misrouted, " +
                    "    b.registered_at, " +
                    "    b.last_scan_time " +
                    "FROM baggage b " +
                    "LEFT JOIN flights f ON b.flight_id = f.id " +
                    "ON CONFLICT (baggage_tag) DO UPDATE SET " +
                    "    current_status_key = EXCLUDED.current_status_key, " +
                    "    is_delayed = EXCLUDED.is_delayed, " +
                    "    is_misrouted = EXCLUDED.is_misrouted, " +
                    "    last_scan_at = EXCLUDED.last_scan_at, " +
                    "    dw_updated_at = CURRENT_TIMESTAMP"
            );
            factsRefreshed += lifeFacts;

            // 4. Refresh Facts: fact_handling_scans (append new events, ignore duplicates)
            int scanFacts = jdbcTemplate.update(
                    "INSERT INTO cargoflight_dw.fact_handling_scans ( " +
                    "    event_id, baggage_tag, point_key, status_after_key, " +
                    "    scan_type, scanner_id, operator_username, event_time " +
                    ") " +
                    "SELECT " +
                    "    'EVT-' || m.id, " +
                    "    m.baggage_tag, " +
                    "    m.handling_point_id, " +
                    "    m.status_after, " +
                    "    m.scan_type, " +
                    "    m.scanner_id, " +
                    "    m.operator_username, " +
                    "    m.recorded_at " +
                    "FROM baggage_movement_history m " +
                    "ON CONFLICT (event_id) DO NOTHING"
            );
            factsRefreshed += scanFacts;

            // 5. Refresh Facts: fact_flight_baggage_performance
            int flightFacts = jdbcTemplate.update(
                    "INSERT INTO cargoflight_dw.fact_flight_baggage_performance ( " +
                    "    flight_key, terminal_key, scheduled_departure, " +
                    "    total_expected_bags, total_loaded_bags, load_completion_percent, flight_status " +
                    ") " +
                    "SELECT " +
                    "    flight_number, " +
                    "    COALESCE(terminal, 'T2'), " +
                    "    scheduled_departure, " +
                    "    total_expected_bags, " +
                    "    total_loaded_bags, " +
                    "    CASE WHEN total_expected_bags > 0 " +
                    "         THEN ROUND((total_loaded_bags::numeric / total_expected_bags::numeric) * 100.0, 2) " +
                    "         ELSE 0.00 END, " +
                    "    status " +
                    "FROM flights " +
                    "ON CONFLICT (flight_key) DO UPDATE SET " +
                    "    total_expected_bags = EXCLUDED.total_expected_bags, " +
                    "    total_loaded_bags = EXCLUDED.total_loaded_bags, " +
                    "    load_completion_percent = EXCLUDED.load_completion_percent, " +
                    "    flight_status = EXCLUDED.flight_status, " +
                    "    dw_refreshed_at = CURRENT_TIMESTAMP"
            );
            factsRefreshed += flightFacts;

            long duration = System.currentTimeMillis() - startTime;

            // 6. Log refresh batch in warehouse_refresh_log
            jdbcTemplate.update(
                    "INSERT INTO cargoflight_dw.warehouse_refresh_log ( " +
                    "    refresh_batch_id, started_at, completed_at, duration_ms, " +
                    "    dimensions_refreshed, facts_inserted, facts_updated, status, triggered_by " +
                    ") VALUES (?, CURRENT_TIMESTAMP - INTERVAL '1 second', CURRENT_TIMESTAMP, ?, ?, ?, 0, 'SUCCESS', ?)",
                    batchId, duration, dimensionsRefreshed, factsRefreshed, operatorUsername != null ? operatorUsername : "system"
            );

            log.info("Warehouse refresh batch {} completed successfully in {} ms (Dimensions: {}, Facts: {}).",
                    batchId, duration, dimensionsRefreshed, factsRefreshed);

            return new WarehouseRefreshResult(batchId, dimensionsRefreshed, factsRefreshed, duration, true,
                    String.format("Warehouse refreshed successfully: %d dimensions and %d facts updated in %d ms (Batch: %s).",
                            dimensionsRefreshed, factsRefreshed, duration, batchId));

        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Warehouse refresh failed: {}", ex.getMessage());
            try {
                jdbcTemplate.update(
                        "INSERT INTO cargoflight_dw.warehouse_refresh_log ( " +
                        "    refresh_batch_id, started_at, completed_at, duration_ms, " +
                        "    dimensions_refreshed, facts_inserted, facts_updated, status, error_message, triggered_by " +
                        ") VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 0, 0, 0, 'FAILED', ?, ?)",
                        batchId, duration, ex.getMessage(), operatorUsername != null ? operatorUsername : "system"
                );
            } catch (Exception ignored) {}

            return new WarehouseRefreshResult(batchId, 0, 0, duration, false,
                    "Warehouse refresh failed: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public WarehouseStatusDto getWarehouseStatus() {
        WarehouseStatusDto dto = new WarehouseStatusDto();
        try {
            Long lifeCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM cargoflight_dw.fact_baggage_lifecycle", Long.class);
            Long scanCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM cargoflight_dw.fact_handling_scans", Long.class);
            Long flightCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM cargoflight_dw.fact_flight_baggage_performance", Long.class);

            dto.setInitialized(true);
            dto.setTotalLifecycleFacts(lifeCount != null ? lifeCount : 0);
            dto.setTotalScanFacts(scanCount != null ? scanCount : 0);
            dto.setTotalFlightFacts(flightCount != null ? flightCount : 0);

            List<Map<String, Object>> latestLog = jdbcTemplate.queryForList(
                    "SELECT refresh_batch_id, completed_at, status FROM cargoflight_dw.warehouse_refresh_log ORDER BY id DESC LIMIT 1"
            );
            if (!latestLog.isEmpty()) {
                Map<String, Object> row = latestLog.get(0);
                dto.setLastBatchId((String) row.get("refresh_batch_id"));
                dto.setLastRefreshedAt(row.get("completed_at") != null ? row.get("completed_at").toString() : "N/A");
                dto.setLastStatus((String) row.get("status"));
            }
        } catch (Exception e) {
            dto.setInitialized(false);
            dto.setLastStatus("SCHEMA_NOT_FOUND");
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTerminalVolumeOlap() {
        try {
            return jdbcTemplate.queryForList("SELECT * FROM cargoflight_dw.v_olap_volume_by_terminal");
        } catch (Exception e) {
            log.warn("Failed to query v_olap_volume_by_terminal: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFlightPerformanceOlap() {
        try {
            return jdbcTemplate.queryForList("SELECT * FROM cargoflight_dw.v_olap_flight_performance");
        } catch (Exception e) {
            log.warn("Failed to query v_olap_flight_performance: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStageDurationOlap() {
        try {
            return jdbcTemplate.queryForList("SELECT * FROM cargoflight_dw.v_olap_duration_by_stage");
        } catch (Exception e) {
            log.warn("Failed to query v_olap_duration_by_stage: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private void createWarehouseSchemaIfMissing() {
        try {
            jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS cargoflight_dw");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_terminal (" +
                    "terminal_key VARCHAR(16) PRIMARY KEY, terminal_name VARCHAR(64), airport_code VARCHAR(3), total_gates INT, total_conveyors INT, is_active BOOLEAN)");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_flight (" +
                    "flight_key VARCHAR(32) PRIMARY KEY, airline_code VARCHAR(8), airline_name VARCHAR(64), origin_iata VARCHAR(3), destination_iata VARCHAR(3), terminal VARCHAR(8), gate VARCHAR(16), is_active BOOLEAN)");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_handling_point (" +
                    "point_key VARCHAR(32) PRIMARY KEY, point_name VARCHAR(128), category VARCHAR(32), zone VARCHAR(64), capacity_per_hour INT, is_active BOOLEAN)");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cargoflight_dw.dim_baggage_status (" +
                    "status_key VARCHAR(32) PRIMARY KEY, stage_name VARCHAR(64), stage_category VARCHAR(32), is_terminal_state BOOLEAN)");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_baggage_lifecycle (" +
                    "fact_id BIGINT AUTO_INCREMENT PRIMARY KEY, baggage_tag VARCHAR(32) UNIQUE, flight_key VARCHAR(32), terminal_key VARCHAR(16), current_status_key VARCHAR(32), origin_iata VARCHAR(3), destination_iata VARCHAR(3), weight_kg DECIMAL(5,2), total_scans INT DEFAULT 0, total_duration_minutes INT DEFAULT 0, is_delayed BOOLEAN DEFAULT FALSE, is_misrouted BOOLEAN DEFAULT FALSE, first_scan_at TIMESTAMP, last_scan_at TIMESTAMP, dw_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_handling_scans (" +
                    "fact_id BIGINT AUTO_INCREMENT PRIMARY KEY, event_id VARCHAR(64) UNIQUE, baggage_tag VARCHAR(32), point_key VARCHAR(32), status_after_key VARCHAR(32), scan_type VARCHAR(32), scanner_id VARCHAR(32), operator_username VARCHAR(64), event_time TIMESTAMP, dw_loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cargoflight_dw.fact_flight_baggage_performance (" +
                    "fact_id BIGINT AUTO_INCREMENT PRIMARY KEY, flight_key VARCHAR(32) UNIQUE, terminal_key VARCHAR(16), scheduled_departure TIMESTAMP, total_expected_bags INT, total_loaded_bags INT, load_completion_percent DECIMAL(5,2), flight_status VARCHAR(32), dw_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cargoflight_dw.warehouse_refresh_log (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, refresh_batch_id VARCHAR(64), started_at TIMESTAMP, completed_at TIMESTAMP, duration_ms BIGINT, dimensions_refreshed INT, facts_inserted INT, facts_updated INT, status VARCHAR(16), error_message TEXT, triggered_by VARCHAR(64))");
        } catch (Exception ex) {
            log.warn("Could not auto-create warehouse schema: {}", ex.getMessage());
        }
    }
}
