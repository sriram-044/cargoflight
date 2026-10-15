package com.aerotrace.maa.integration.mongodb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "scanner_diagnostics")
public class ScannerDiagnosticDocument {

    @Id
    private String id;

    @Indexed
    private String scannerId;

    @Indexed
    private String status; // ONLINE, WARNING, FAULT, OFFLINE

    private double batteryLevelPercent;

    private double temperatureCelsius;

    private long totalScansToday;

    private long errorCountToday;

    private String firmwareVersion;

    @Indexed(expireAfter = "604800s") // 7-day TTL
    private Instant recordedAt = Instant.now();

    public ScannerDiagnosticDocument() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getScannerId() { return scannerId; }
    public void setScannerId(String scannerId) { this.scannerId = scannerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getBatteryLevelPercent() { return batteryLevelPercent; }
    public void setBatteryLevelPercent(double batteryLevelPercent) { this.batteryLevelPercent = batteryLevelPercent; }

    public double getTemperatureCelsius() { return temperatureCelsius; }
    public void setTemperatureCelsius(double temperatureCelsius) { this.temperatureCelsius = temperatureCelsius; }

    public long getTotalScansToday() { return totalScansToday; }
    public void setTotalScansToday(long totalScansToday) { this.totalScansToday = totalScansToday; }

    public long getErrorCountToday() { return errorCountToday; }
    public void setErrorCountToday(long errorCountToday) { this.errorCountToday = errorCountToday; }

    public String getFirmwareVersion() { return firmwareVersion; }
    public void setFirmwareVersion(String firmwareVersion) { this.firmwareVersion = firmwareVersion; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
