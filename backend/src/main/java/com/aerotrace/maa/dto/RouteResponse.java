package com.aerotrace.maa.dto;

import java.math.BigDecimal;
import java.util.List;

public class RouteResponse {
    private boolean routeFound;
    private String originPointId;
    private String destinationPointId;
    private List<HandlingPointDto> orderedPath;
    private List<RouteEdgeDto> edges;
    private BigDecimal totalDistanceMeters;
    private int estimatedTraversalSeconds;
    private String routingEngine; // "NEO4J_CYPHER" or "MAA_TOPOLOGY_SOLVER"
    private boolean reroutedDueToBlockage;
    private String message;

    public static class RouteEdgeDto {
        private String fromId;
        private String toId;
        private BigDecimal distanceMeters;
        private int estimatedSeconds;
        private boolean active;

        public RouteEdgeDto() {}

        public RouteEdgeDto(String fromId, String toId, BigDecimal distanceMeters, int estimatedSeconds, boolean active) {
            this.fromId = fromId;
            this.toId = toId;
            this.distanceMeters = distanceMeters;
            this.estimatedSeconds = estimatedSeconds;
            this.active = active;
        }

        public String getFromId() { return fromId; }
        public void setFromId(String fromId) { this.fromId = fromId; }
        public String getToId() { return toId; }
        public void setToId(String toId) { this.toId = toId; }
        public BigDecimal getDistanceMeters() { return distanceMeters; }
        public void setDistanceMeters(BigDecimal distanceMeters) { this.distanceMeters = distanceMeters; }
        public int getEstimatedSeconds() { return estimatedSeconds; }
        public void setEstimatedSeconds(int estimatedSeconds) { this.estimatedSeconds = estimatedSeconds; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }

    public RouteResponse() {}

    // Getters and Setters
    public boolean isRouteFound() { return routeFound; }
    public void setRouteFound(boolean routeFound) { this.routeFound = routeFound; }

    public String getOriginPointId() { return originPointId; }
    public void setOriginPointId(String originPointId) { this.originPointId = originPointId; }

    public String getDestinationPointId() { return destinationPointId; }
    public void setDestinationPointId(String destinationPointId) { this.destinationPointId = destinationPointId; }

    public List<HandlingPointDto> getOrderedPath() { return orderedPath; }
    public void setOrderedPath(List<HandlingPointDto> orderedPath) { this.orderedPath = orderedPath; }

    public List<RouteEdgeDto> getEdges() { return edges; }
    public void setEdges(List<RouteEdgeDto> edges) { this.edges = edges; }

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
}
