package com.aerotrace.maa.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class RouteCalculationRequest {

    @NotBlank(message = "Origin handling point ID is required")
    private String originPointId;

    @NotBlank(message = "Destination handling point ID is required")
    private String destinationPointId;

    private List<String> blockedConnectionIds;
    private String optimizationObjective = "DISTANCE"; // DISTANCE, TIME, CONGESTION, MAINTENANCE, BALANCED

    public RouteCalculationRequest() {}

    public RouteCalculationRequest(String originPointId, String destinationPointId) {
        this.originPointId = originPointId;
        this.destinationPointId = destinationPointId;
        this.optimizationObjective = "DISTANCE";
    }

    public RouteCalculationRequest(String originPointId, String destinationPointId, String optimizationObjective) {
        this.originPointId = originPointId;
        this.destinationPointId = destinationPointId;
        this.optimizationObjective = optimizationObjective != null ? optimizationObjective : "DISTANCE";
    }

    public String getOriginPointId() { return originPointId; }
    public void setOriginPointId(String originPointId) { this.originPointId = originPointId; }

    // Alias for originId
    public String getOriginId() { return originPointId; }
    public void setOriginId(String originId) { this.originPointId = originId; }

    public String getDestinationPointId() { return destinationPointId; }
    public void setDestinationPointId(String destinationPointId) { this.destinationPointId = destinationPointId; }

    // Alias for destinationId
    public String getDestinationId() { return destinationPointId; }
    public void setDestinationId(String destinationId) { this.destinationPointId = destinationId; }

    public List<String> getBlockedConnectionIds() { return blockedConnectionIds; }
    public void setBlockedConnectionIds(List<String> blockedConnectionIds) { this.blockedConnectionIds = blockedConnectionIds; }

    public String getOptimizationObjective() { return optimizationObjective; }
    public void setOptimizationObjective(String optimizationObjective) {
        this.optimizationObjective = optimizationObjective != null ? optimizationObjective.toUpperCase() : "DISTANCE";
    }
}
