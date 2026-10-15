package com.aerotrace.maa.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class RouteCalculationRequest {

    @NotBlank(message = "Origin handling point ID is required")
    private String originPointId;

    @NotBlank(message = "Destination handling point ID is required")
    private String destinationPointId;

    private List<String> blockedConnectionIds;
    private String optimizationObjective = "DISTANCE"; // "DISTANCE" or "TIME"

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

    public String getDestinationPointId() { return destinationPointId; }
    public void setDestinationPointId(String destinationPointId) { this.destinationPointId = destinationPointId; }

    public List<String> getBlockedConnectionIds() { return blockedConnectionIds; }
    public void setBlockedConnectionIds(List<String> blockedConnectionIds) { this.blockedConnectionIds = blockedConnectionIds; }

    public String getOptimizationObjective() { return optimizationObjective; }
    public void setOptimizationObjective(String optimizationObjective) { this.optimizationObjective = optimizationObjective; }
}
