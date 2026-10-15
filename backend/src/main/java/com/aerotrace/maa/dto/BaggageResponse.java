package com.aerotrace.maa.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class BaggageResponse {
    private Long id;
    private String baggageTag;
    private Long flightId;
    private String flightNumber;
    private String airlineName;
    private String passengerName;
    private String passengerPnr;
    private String originIata;
    private String destinationIata;
    private BigDecimal weightKg;
    private String currentStatus;
    private String currentHandlingPointId;
    private String currentHandlingPointName;
    private OffsetDateTime lastScanTime;
    private boolean delayed;
    private boolean misrouted;
    private boolean rush;
    private OffsetDateTime registeredAt;
    private OffsetDateTime updatedAt;
    private List<BaggageMovementDto> movementHistory;
    private String expectedNextHandlingPointId;
    private String expectedNextHandlingPointName;

    public BaggageResponse() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public Long getFlightId() { return flightId; }
    public void setFlightId(Long flightId) { this.flightId = flightId; }

    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }

    public String getAirlineName() { return airlineName; }
    public void setAirlineName(String airlineName) { this.airlineName = airlineName; }

    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }

    public String getPassengerPnr() { return passengerPnr; }
    public void setPassengerPnr(String passengerPnr) { this.passengerPnr = passengerPnr; }

    public String getOriginIata() { return originIata; }
    public void setOriginIata(String originIata) { this.originIata = originIata; }

    public String getDestinationIata() { return destinationIata; }
    public void setDestinationIata(String destinationIata) { this.destinationIata = destinationIata; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public String getCurrentHandlingPointId() { return currentHandlingPointId; }
    public void setCurrentHandlingPointId(String currentHandlingPointId) { this.currentHandlingPointId = currentHandlingPointId; }

    public String getCurrentHandlingPointName() { return currentHandlingPointName; }
    public void setCurrentHandlingPointName(String currentHandlingPointName) { this.currentHandlingPointName = currentHandlingPointName; }

    public OffsetDateTime getLastScanTime() { return lastScanTime; }
    public void setLastScanTime(OffsetDateTime lastScanTime) { this.lastScanTime = lastScanTime; }

    public boolean isDelayed() { return delayed; }
    public void setDelayed(boolean delayed) { this.delayed = delayed; }

    public boolean isMisrouted() { return misrouted; }
    public void setMisrouted(boolean misrouted) { this.misrouted = misrouted; }

    public boolean isRush() { return rush; }
    public void setRush(boolean rush) { this.rush = rush; }

    public OffsetDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(OffsetDateTime registeredAt) { this.registeredAt = registeredAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<BaggageMovementDto> getMovementHistory() { return movementHistory; }
    public void setMovementHistory(List<BaggageMovementDto> movementHistory) { this.movementHistory = movementHistory; }

    public String getExpectedNextHandlingPointId() { return expectedNextHandlingPointId; }
    public void setExpectedNextHandlingPointId(String expectedNextHandlingPointId) { this.expectedNextHandlingPointId = expectedNextHandlingPointId; }

    public String getExpectedNextHandlingPointName() { return expectedNextHandlingPointName; }
    public void setExpectedNextHandlingPointName(String expectedNextHandlingPointName) { this.expectedNextHandlingPointName = expectedNextHandlingPointName; }
}
