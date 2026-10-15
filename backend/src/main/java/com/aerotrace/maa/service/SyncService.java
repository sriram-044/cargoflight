package com.aerotrace.maa.service;

import com.aerotrace.maa.entity.Baggage;
import com.aerotrace.maa.repository.BaggageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.UUID;

@Service
public class SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final BaggageRepository baggageRepository;
    private final com.aerotrace.maa.repository.FlightRepository flightRepository;

    @Value("${aerotrace.mysql.enabled:false}")
    private boolean mysqlEnabled;

    @Value("${aerotrace.mysql.url:jdbc:mysql://localhost:3306/aerotrace_secondary}")
    private String mysqlUrl;

    @Value("${aerotrace.mysql.username:aerotrace_sync}")
    private String mysqlUsername;

    @Value("${aerotrace.mysql.password:aerotrace_mysql_password_2026}")
    private String mysqlPassword;

    public SyncService(BaggageRepository baggageRepository, com.aerotrace.maa.repository.FlightRepository flightRepository) {
        this.baggageRepository = baggageRepository;
        this.flightRepository = flightRepository;
    }

    public static class SyncResult {
        private int baggageRecordsSynced;
        private int flightManifestsSynced;
        private long durationMs;
        private boolean success;
        private String message;

        public SyncResult(int baggageRecordsSynced, int flightManifestsSynced, long durationMs, boolean success, String message) {
            this.baggageRecordsSynced = baggageRecordsSynced;
            this.flightManifestsSynced = flightManifestsSynced;
            this.durationMs = durationMs;
            this.success = success;
            this.message = message;
        }

        public int getBaggageRecordsSynced() { return baggageRecordsSynced; }
        public int getFlightManifestsSynced() { return flightManifestsSynced; }
        public long getDurationMs() { return durationMs; }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    public SyncResult synchronizeToSecondary() {
        if (!mysqlEnabled) {
            log.info("MySQL secondary sync is disabled; skipping synchronization.");
            return new SyncResult(0, 0, 0, false, "MySQL secondary mirror synchronization is disabled in configuration.");
        }

        long startTime = System.currentTimeMillis();
        String batchId = "SYNC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        List<Baggage> baggageList = baggageRepository.findAll();
        List<com.aerotrace.maa.entity.Flight> flightList = flightRepository.findAll();
        int bagSynced = 0;
        int flightSynced = 0;

        try (Connection conn = DriverManager.getConnection(mysqlUrl, mysqlUsername, mysqlPassword)) {
            conn.setAutoCommit(false);

            // 1. Sync Baggage Mirrors (Clear previous snapshot to prevent unbounded duplicates and recreate current state)
            try (PreparedStatement delStmt = conn.prepareStatement("DELETE FROM sync_baggage_mirrors")) {
                delStmt.executeUpdate();
            }

            String bagSql = "INSERT INTO sync_baggage_mirrors " +
                    "(baggage_tag, flight_number, current_status, last_handling_point, reconciliation_verified) " +
                    "VALUES (?, ?, ?, ?, TRUE)";

            try (PreparedStatement ps = conn.prepareStatement(bagSql)) {
                for (Baggage b : baggageList) {
                    ps.setString(1, b.getBaggageTag());
                    ps.setString(2, b.getFlight() != null ? b.getFlight().getFlightNumber() : "UNKNOWN");
                    ps.setString(3, b.getCurrentStatus());
                    ps.setString(4, b.getCurrentHandlingPoint() != null ? b.getCurrentHandlingPoint().getId() : "N/A");
                    ps.addBatch();
                    bagSynced++;
                }
                ps.executeBatch();
            }

            // 2. Sync Flight Manifests (with ON DUPLICATE KEY UPDATE)
            String flightSql = "INSERT INTO sync_flight_manifests " +
                    "(flight_number, scheduled_departure, origin_iata, destination_iata, total_expected_bags, total_loaded_bags, sync_status) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 'SYNCHRONIZED') " +
                    "ON DUPLICATE KEY UPDATE " +
                    "total_expected_bags = VALUES(total_expected_bags), " +
                    "total_loaded_bags = VALUES(total_loaded_bags), " +
                    "last_synced_at = CURRENT_TIMESTAMP, " +
                    "sync_status = 'SYNCHRONIZED'";

            try (PreparedStatement fps = conn.prepareStatement(flightSql)) {
                for (com.aerotrace.maa.entity.Flight f : flightList) {
                    fps.setString(1, f.getFlightNumber());
                    fps.setTimestamp(2, java.sql.Timestamp.from(f.getScheduledDeparture().toInstant()));
                    fps.setString(3, f.getOriginIata());
                    fps.setString(4, f.getDestinationIata());
                    fps.setInt(5, f.getTotalExpectedBags());
                    fps.setInt(6, f.getTotalLoadedBags());
                    fps.addBatch();
                    flightSynced++;
                }
                fps.executeBatch();
            }

            long duration = System.currentTimeMillis() - startTime;

            // 3. Record in sync_audit_journal
            String journalSql = "INSERT INTO sync_audit_journal (batch_id, records_synced, sync_duration_ms, status) " +
                    "VALUES (?, ?, ?, 'SUCCESS')";
            try (PreparedStatement jps = conn.prepareStatement(journalSql)) {
                jps.setString(1, batchId);
                jps.setInt(2, bagSynced + flightSynced);
                jps.setLong(3, duration);
                jps.executeUpdate();
            }

            conn.commit();
            log.info("Batch {}: Synchronized {} baggage records and {} flight manifests to MySQL secondary in {} ms.",
                    batchId, bagSynced, flightSynced, duration);

            return new SyncResult(bagSynced, flightSynced, duration, true,
                    String.format("Successfully synchronized %d baggage records and %d flight manifests in %d ms (Batch: %s).",
                            bagSynced, flightSynced, duration, batchId));
        } catch (Exception e) {
            log.error("Failed to sync to MySQL secondary database: {}", e.getMessage());
            return new SyncResult(0, 0, System.currentTimeMillis() - startTime, false,
                    "Failed to synchronize to MySQL secondary database: " + e.getMessage());
        }
    }
}
