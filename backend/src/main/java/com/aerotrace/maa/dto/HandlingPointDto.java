package com.aerotrace.maa.dto;

import java.util.List;

public class HandlingPointDto {
    private String id;
    private String airportCode = "MAA";
    private String name;
    private String category;
    private String zone;
    private String operationalStatus;
    private int capacityPerHour;
    private List<String> connectedToIds;
    private int activeScannerCount;

    public HandlingPointDto() {}

    public HandlingPointDto(String id, String name, String category, String zone, String operationalStatus, int capacityPerHour) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.zone = zone;
        this.operationalStatus = operationalStatus;
        this.capacityPerHour = capacityPerHour;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAirportCode() { return airportCode; }
    public void setAirportCode(String airportCode) { this.airportCode = airportCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }

    public int getCapacityPerHour() { return capacityPerHour; }
    public void setCapacityPerHour(int capacityPerHour) { this.capacityPerHour = capacityPerHour; }

    public List<String> getConnectedToIds() { return connectedToIds; }
    public void setConnectedToIds(List<String> connectedToIds) { this.connectedToIds = connectedToIds; }

    public int getActiveScannerCount() { return activeScannerCount; }
    public void setActiveScannerCount(int activeScannerCount) { this.activeScannerCount = activeScannerCount; }
}
