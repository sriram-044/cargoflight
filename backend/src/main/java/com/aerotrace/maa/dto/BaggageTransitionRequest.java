package com.aerotrace.maa.dto;

import jakarta.validation.constraints.NotBlank;

public class BaggageTransitionRequest {

    @NotBlank(message = "Target status is required")
    private String targetStatus;

    private String handlingPointId;

    private String notes;

    private String scannerId;

    public BaggageTransitionRequest() {}

    public BaggageTransitionRequest(String targetStatus, String handlingPointId, String notes) {
        this.targetStatus = targetStatus;
        this.handlingPointId = handlingPointId;
        this.notes = notes;
    }

    public String getTargetStatus() { return targetStatus; }
    public void setTargetStatus(String targetStatus) { this.targetStatus = targetStatus; }

    public String getHandlingPointId() { return handlingPointId; }
    public void setHandlingPointId(String handlingPointId) { this.handlingPointId = handlingPointId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getScannerId() { return scannerId; }
    public void setScannerId(String scannerId) { this.scannerId = scannerId; }
}
