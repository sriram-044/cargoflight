package com.aerotrace.maa.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class DatabaseHealthDto {

    private OffsetDateTime checkedAt = OffsetDateTime.now();
    private boolean overallOperational;
    private List<DatabaseCheckResult> databases;

    public static class DatabaseCheckResult {
        private String databaseName;
        private String role; // PRIMARY_OPERATIONAL, TELEMETRY, GRAPH_ROUTING, SECONDARY_SYNC
        private String status; // PASS, FAIL, BLOCKED, NOT CONFIGURED
        private boolean connected;
        private String endpointSafe; // e.g. "localhost:5432 / aerotrace_india" (no password)
        private String details;
        private long latencyMs;
        private long recordCount;
        private OffsetDateTime lastVerified = OffsetDateTime.now();

        public DatabaseCheckResult() {}

        public DatabaseCheckResult(String databaseName, String role, String status, boolean connected, String endpointSafe, String details, long latencyMs, long recordCount) {
            this.databaseName = databaseName;
            this.role = role;
            this.status = status;
            this.connected = connected;
            this.endpointSafe = endpointSafe;
            this.details = details;
            this.latencyMs = latencyMs;
            this.recordCount = recordCount;
        }

        // Getters and Setters
        public String getDatabaseName() { return databaseName; }
        public void setDatabaseName(String databaseName) { this.databaseName = databaseName; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public boolean isConnected() { return connected; }
        public void setConnected(boolean connected) { this.connected = connected; }

        public String getEndpointSafe() { return endpointSafe; }
        public void setEndpointSafe(String endpointSafe) { this.endpointSafe = endpointSafe; }

        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }

        public long getLatencyMs() { return latencyMs; }
        public void setLatencyMs(long latencyMs) { this.latencyMs = latencyMs; }

        public long getRecordCount() { return recordCount; }
        public void setRecordCount(long recordCount) { this.recordCount = recordCount; }

        public OffsetDateTime getLastVerified() { return lastVerified; }
        public void setLastVerified(OffsetDateTime lastVerified) { this.lastVerified = lastVerified; }
    }

    public DatabaseHealthDto() {}

    // Getters and Setters
    public OffsetDateTime getCheckedAt() { return checkedAt; }
    public void setCheckedAt(OffsetDateTime checkedAt) { this.checkedAt = checkedAt; }

    public boolean isOverallOperational() { return overallOperational; }
    public void setOverallOperational(boolean overallOperational) { this.overallOperational = overallOperational; }

    public List<DatabaseCheckResult> getDatabases() { return databases; }
    public void setDatabases(List<DatabaseCheckResult> databases) { this.databases = databases; }
}
