package com.aerotrace.maa.dto;

import java.time.OffsetDateTime;

public class ScanResultResponse {
    private boolean success;
    private String message;
    private String baggageTag;
    private String scannerId;
    private String handlingPointId;
    private String handlingPointName;
    private String previousStatus;
    private String newStatus;
    private String idempotencyKey;
    private boolean duplicate;
    private boolean telemetryPersistedMongo;
    private boolean operationalPersistedPostgres;
    private OffsetDateTime processedAt = OffsetDateTime.now();

    public ScanResultResponse() {}

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public String getScannerId() { return scannerId; }
    public void setScannerId(String scannerId) { this.scannerId = scannerId; }

    public String getHandlingPointId() { return handlingPointId; }
    public void setHandlingPointId(String handlingPointId) { this.handlingPointId = handlingPointId; }

    public String getHandlingPointName() { return handlingPointName; }
    public void setHandlingPointName(String handlingPointName) { this.handlingPointName = handlingPointName; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public boolean isDuplicate() { return duplicate; }
    public void setDuplicate(boolean duplicate) { this.duplicate = duplicate; }

    public boolean isTelemetryPersistedMongo() { return telemetryPersistedMongo; }
    public void setTelemetryPersistedMongo(boolean telemetryPersistedMongo) { this.telemetryPersistedMongo = telemetryPersistedMongo; }

    public boolean isOperationalPersistedPostgres() { return operationalPersistedPostgres; }
    public void setOperationalPersistedPostgres(boolean operationalPersistedPostgres) { this.operationalPersistedPostgres = operationalPersistedPostgres; }

    public OffsetDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(OffsetDateTime processedAt) { this.processedAt = processedAt; }
}
