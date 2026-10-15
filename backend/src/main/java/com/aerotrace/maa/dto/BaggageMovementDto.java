package com.aerotrace.maa.dto;

import java.time.OffsetDateTime;

public class BaggageMovementDto {
    private Long id;
    private String baggageTag;
    private String handlingPointId;
    private String handlingPointName;
    private String previousPointId;
    private String previousPointName;
    private String statusBefore;
    private String statusAfter;
    private String scannerId;
    private String scanType;
    private String operatorUsername;
    private OffsetDateTime recordedAt;
    private String notes;

    public BaggageMovementDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public String getHandlingPointId() { return handlingPointId; }
    public void setHandlingPointId(String handlingPointId) { this.handlingPointId = handlingPointId; }

    public String getHandlingPointName() { return handlingPointName; }
    public void setHandlingPointName(String handlingPointName) { this.handlingPointName = handlingPointName; }

    public String getPreviousPointId() { return previousPointId; }
    public void setPreviousPointId(String previousPointId) { this.previousPointId = previousPointId; }

    public String getPreviousPointName() { return previousPointName; }
    public void setPreviousPointName(String previousPointName) { this.previousPointName = previousPointName; }

    public String getStatusBefore() { return statusBefore; }
    public void setStatusBefore(String statusBefore) { this.statusBefore = statusBefore; }

    public String getStatusAfter() { return statusAfter; }
    public void setStatusAfter(String statusAfter) { this.statusAfter = statusAfter; }

    public String getScannerId() { return scannerId; }
    public void setScannerId(String scannerId) { this.scannerId = scannerId; }

    public String getScanType() { return scanType; }
    public void setScanType(String scanType) { this.scanType = scanType; }

    public String getOperatorUsername() { return operatorUsername; }
    public void setOperatorUsername(String operatorUsername) { this.operatorUsername = operatorUsername; }

    public OffsetDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(OffsetDateTime recordedAt) { this.recordedAt = recordedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
