package com.aerotrace.maa.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class RouteResponse {
    private boolean routeFound;
    private String originPointId;
    private String destinationPointId;
    private List<HandlingPointDto> orderedPath = new ArrayList<>();
    private List<RouteEdgeDto> edges = new ArrayList<>();
    private BigDecimal totalDistanceMeters = BigDecimal.ZERO;
    private int estimatedTraversalSeconds;
    private String routingEngine; // "NEO4J_CYPHER" or "MAA_TOPOLOGY_SOLVER"
    private boolean reroutedDueToBlockage;
    private String message;
    private String explanation;
    private String optimizationObjective = "DISTANCE";
    private int blockedSegmentsAvoidedCount;
    private int conveyorSegmentCount;
    private int handlingPointCount;
    private List<AlternativeRouteDto> alternatives = new ArrayList<>();

    public static class RouteEdgeDto {
        private String fromId;
        private String toId;
        private String fromName;
        private String toName;
        private BigDecimal distanceMeters;
        private int estimatedSeconds;
        private double speedMetersPerSecond;
        private boolean active;
        private String status; // "HEALTHY", "WARNING", "BLOCKED", "MAINTENANCE"
        private String restrictionNotes;

        public RouteEdgeDto() {}

        public RouteEdgeDto(String fromId, String toId, BigDecimal distanceMeters, int estimatedSeconds, boolean active) {
            this.fromId = fromId;
            this.toId = toId;
            this.distanceMeters = distanceMeters;
            this.estimatedSeconds = estimatedSeconds;
            this.active = active;
            if (estimatedSeconds > 0 && distanceMeters != null) {
                this.speedMetersPerSecond = Math.round((distanceMeters.doubleValue() / estimatedSeconds) * 100.0) / 100.0;
            }
            this.status = active ? "HEALTHY" : "BLOCKED";
        }

        public RouteEdgeDto(String fromId, String toId, String fromName, String toName,
                            BigDecimal distanceMeters, int estimatedSeconds, boolean active,
                            String status, String restrictionNotes) {
            this.fromId = fromId;
            this.toId = toId;
            this.fromName = fromName;
            this.toName = toName;
            this.distanceMeters = distanceMeters;
            this.estimatedSeconds = estimatedSeconds;
            this.active = active;
            if (estimatedSeconds > 0 && distanceMeters != null) {
                this.speedMetersPerSecond = Math.round((distanceMeters.doubleValue() / estimatedSeconds) * 100.0) / 100.0;
            }
            this.status = status;
            this.restrictionNotes = restrictionNotes;
        }

        public String getFromId() { return fromId; }
        public void setFromId(String fromId) { this.fromId = fromId; }

        public String getToId() { return toId; }
        public void setToId(String toId) { this.toId = toId; }

        public String getFromName() { return fromName; }
        public void setFromName(String fromName) { this.fromName = fromName; }

        public String getToName() { return toName; }
        public void setToName(String toName) { this.toName = toName; }

        public BigDecimal getDistanceMeters() { return distanceMeters; }
        public void setDistanceMeters(BigDecimal distanceMeters) { this.distanceMeters = distanceMeters; }

        public int getEstimatedSeconds() { return estimatedSeconds; }
        public void setEstimatedSeconds(int estimatedSeconds) { this.estimatedSeconds = estimatedSeconds; }

        public double getSpeedMetersPerSecond() { return speedMetersPerSecond; }
        public void setSpeedMetersPerSecond(double speedMetersPerSecond) { this.speedMetersPerSecond = speedMetersPerSecond; }

        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getRestrictionNotes() { return restrictionNotes; }
        public void setRestrictionNotes(String restrictionNotes) { this.restrictionNotes = restrictionNotes; }
    }

    public static class AlternativeRouteDto {
        private String routeId; // "ROUTE_A", "ROUTE_B", etc.
        private String label; // "Route A — Recommended", "Route B — Alternative"
        private boolean recommended;
        private boolean available;
        private List<HandlingPointDto> orderedPath = new ArrayList<>();
        private List<RouteEdgeDto> edges = new ArrayList<>();
        private BigDecimal totalDistanceMeters;
        private int estimatedTraversalSeconds;
        private BigDecimal deltaDistanceMeters;
        private int deltaSeconds;
        private String description;

        public AlternativeRouteDto() {}

        public String getRouteId() { return routeId; }
        public void setRouteId(String routeId) { this.routeId = routeId; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public boolean isRecommended() { return recommended; }
        public void setRecommended(boolean recommended) { this.recommended = recommended; }

        public boolean isAvailable() { return available; }
        public void setAvailable(boolean available) { this.available = available; }

        public List<HandlingPointDto> getOrderedPath() { return orderedPath; }
        public void setOrderedPath(List<HandlingPointDto> orderedPath) { this.orderedPath = orderedPath; }

        public List<RouteEdgeDto> getEdges() { return edges; }
        public void setEdges(List<RouteEdgeDto> edges) { this.edges = edges; }

        public BigDecimal getTotalDistanceMeters() { return totalDistanceMeters; }
        public void setTotalDistanceMeters(BigDecimal totalDistanceMeters) { this.totalDistanceMeters = totalDistanceMeters; }

        public int getEstimatedTraversalSeconds() { return estimatedTraversalSeconds; }
        public void setEstimatedTraversalSeconds(int estimatedTraversalSeconds) { this.estimatedTraversalSeconds = estimatedTraversalSeconds; }

        public BigDecimal getDeltaDistanceMeters() { return deltaDistanceMeters; }
        public void setDeltaDistanceMeters(BigDecimal deltaDistanceMeters) { this.deltaDistanceMeters = deltaDistanceMeters; }

        public int getDeltaSeconds() { return deltaSeconds; }
        public void setDeltaSeconds(int deltaSeconds) { this.deltaSeconds = deltaSeconds; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public RouteResponse() {}

    public boolean isRouteFound() { return routeFound; }
    public void setRouteFound(boolean routeFound) { this.routeFound = routeFound; }

    public String getOriginPointId() { return originPointId; }
    public void setOriginPointId(String originPointId) { this.originPointId = originPointId; }

    public String getDestinationPointId() { return destinationPointId; }
    public void setDestinationPointId(String destinationPointId) { this.destinationPointId = destinationPointId; }

    public List<HandlingPointDto> getOrderedPath() { return orderedPath; }
    public void setOrderedPath(List<HandlingPointDto> orderedPath) {
        this.orderedPath = orderedPath;
        this.handlingPointCount = orderedPath != null ? orderedPath.size() : 0;
    }

    public List<RouteEdgeDto> getEdges() { return edges; }
    public void setEdges(List<RouteEdgeDto> edges) {
        this.edges = edges;
        this.conveyorSegmentCount = edges != null ? edges.size() : 0;
    }

    public BigDecimal getTotalDistanceMeters() { return totalDistanceMeters; }
    public void setTotalDistanceMeters(BigDecimal totalDistanceMeters) { this.totalDistanceMeters = totalDistanceMeters; }

    public int getEstimatedTraversalSeconds() { return estimatedTraversalSeconds; }
    public void setEstimatedTraversalSeconds(int estimatedTraversalSeconds) { this.estimatedTraversalSeconds = estimatedTraversalSeconds; }

    public String getRoutingEngine() { return routingEngine; }
    public void setRoutingEngine(String routingEngine) { this.routingEngine = routingEngine; }

    public boolean isReroutedDueToBlockage() { return reroutedDueToBlockage; }
    public void setReroutedDueToBlockage(boolean reroutedDueToBlockage) { this.reroutedDueToBlockage = reroutedDueToBlockage; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getOptimizationObjective() { return optimizationObjective; }
    public void setOptimizationObjective(String optimizationObjective) { this.optimizationObjective = optimizationObjective; }

    public int getBlockedSegmentsAvoidedCount() { return blockedSegmentsAvoidedCount; }
    public void setBlockedSegmentsAvoidedCount(int blockedSegmentsAvoidedCount) { this.blockedSegmentsAvoidedCount = blockedSegmentsAvoidedCount; }

    public int getConveyorSegmentCount() { return conveyorSegmentCount; }
    public void setConveyorSegmentCount(int conveyorSegmentCount) { this.conveyorSegmentCount = conveyorSegmentCount; }

    public int getHandlingPointCount() { return handlingPointCount; }
    public void setHandlingPointCount(int handlingPointCount) { this.handlingPointCount = handlingPointCount; }

    public List<AlternativeRouteDto> getAlternatives() { return alternatives; }
    public void setAlternatives(List<AlternativeRouteDto> alternatives) { this.alternatives = alternatives; }
}
