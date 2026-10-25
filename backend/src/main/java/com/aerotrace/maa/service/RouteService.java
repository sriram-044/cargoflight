package com.aerotrace.maa.service;

import com.aerotrace.maa.dto.HandlingPointDto;
import com.aerotrace.maa.dto.RouteCalculationRequest;
import com.aerotrace.maa.dto.RouteResponse;
import com.aerotrace.maa.entity.HandlingPoint;
import com.aerotrace.maa.entity.HandlingPointConnection;
import com.aerotrace.maa.exception.ResourceNotFoundException;
import com.aerotrace.maa.repository.HandlingPointConnectionRepository;
import com.aerotrace.maa.repository.HandlingPointRepository;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RouteService {

    private static final Logger log = LoggerFactory.getLogger(RouteService.class);

    private final HandlingPointRepository handlingPointRepository;
    private final HandlingPointConnectionRepository connectionRepository;

    @Value("${aerotrace.neo4j.enabled:false}")
    private boolean neo4jEnabled;

    @Value("${aerotrace.neo4j.uri:bolt://localhost:7687}")
    private String neo4jUri;

    @Value("${aerotrace.neo4j.username:neo4j}")
    private String neo4jUsername;

    @Value("${aerotrace.neo4j.password:aerotrace_neo4j_2026}")
    private String neo4jPassword;

    public RouteService(HandlingPointRepository handlingPointRepository,
                        HandlingPointConnectionRepository connectionRepository) {
        this.handlingPointRepository = handlingPointRepository;
        this.connectionRepository = connectionRepository;
    }

    @Transactional(readOnly = true)
    public List<HandlingPointDto> getAllLocations() {
        return handlingPointRepository.findAll().stream()
                .map(p -> new HandlingPointDto(p.getId(), p.getName(), p.getCategory(), p.getZone(), p.getOperationalStatus(), p.getCapacityPerHour()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RouteResponse.RouteEdgeDto getSegmentDetails(String fromId, String toId) {
        Optional<HandlingPointConnection> connOpt = connectionRepository.findByFromPointIdAndToPointId(fromId, toId);
        if (connOpt.isEmpty()) {
            throw new ResourceNotFoundException("Conveyor connection segment not found between " + fromId + " and " + toId);
        }
        HandlingPointConnection c = connOpt.get();
        String status = !c.isActive() ? "BLOCKED"
                : (c.getRestrictionNotes() != null && !c.getRestrictionNotes().isBlank()) ? "MAINTENANCE"
                : "HEALTHY";

        return new RouteResponse.RouteEdgeDto(
                c.getFromPoint().getId(),
                c.getToPoint().getId(),
                c.getFromPoint().getName(),
                c.getToPoint().getName(),
                c.getDistanceMeters(),
                c.getEstimatedTraversalSeconds(),
                c.isActive(),
                status,
                c.getRestrictionNotes()
        );
    }

    @Transactional(readOnly = true)
    public RouteResponse.RouteEdgeDto getSegmentDetailsById(Long id) {
        Optional<HandlingPointConnection> connOpt = connectionRepository.findById(id);
        if (connOpt.isEmpty()) {
            throw new ResourceNotFoundException("Conveyor connection segment not found with id: " + id);
        }
        HandlingPointConnection c = connOpt.get();
        String status = !c.isActive() ? "BLOCKED"
                : (c.getRestrictionNotes() != null && !c.getRestrictionNotes().isBlank()) ? "MAINTENANCE"
                : "HEALTHY";

        return new RouteResponse.RouteEdgeDto(
                c.getFromPoint().getId(),
                c.getToPoint().getId(),
                c.getFromPoint().getName(),
                c.getToPoint().getName(),
                c.getDistanceMeters(),
                c.getEstimatedTraversalSeconds(),
                c.isActive(),
                status,
                c.getRestrictionNotes()
        );
    }

    @Transactional(readOnly = true)
    public RouteResponse calculateRoute(RouteCalculationRequest request) {
        String fromId = request.getOriginPointId();
        String toId = request.getDestinationPointId();
        Set<String> blockedIds = request.getBlockedConnectionIds() != null
                ? new HashSet<>(request.getBlockedConnectionIds())
                : Collections.emptySet();
        String objective = request.getOptimizationObjective() != null && !request.getOptimizationObjective().isBlank()
                ? request.getOptimizationObjective().toUpperCase()
                : "DISTANCE";

        // Validate origin and destination exist
        if (!handlingPointRepository.existsById(fromId)) {
            throw new ResourceNotFoundException("Origin handling point not found: " + fromId);
        }
        if (!handlingPointRepository.existsById(toId)) {
            throw new ResourceNotFoundException("Destination handling point not found: " + toId);
        }

        // Validate origin and destination are different
        if (fromId.equalsIgnoreCase(toId)) {
            RouteResponse resp = new RouteResponse();
            resp.setOriginPointId(fromId);
            resp.setDestinationPointId(toId);
            resp.setRouteFound(false);
            resp.setRoutingEngine("MAA_TOPOLOGY_SOLVER");
            resp.setOptimizationObjective(objective);
            resp.setMessage("Starting location and destination location must be different.");
            resp.setExplanation("Baggage cannot be routed to the same handling point. Please select a distinct destination.");
            return resp;
        }

        // Try Neo4j if configured and enabled
        if (neo4jEnabled) {
            try {
                RouteResponse neo4jResponse = queryNeo4jShortestPath(fromId, toId, blockedIds, objective);
                if (neo4jResponse != null && neo4jResponse.isRouteFound()) {
                    return neo4jResponse;
                }
            } catch (Exception ex) {
                log.warn("Neo4j shortest path query failed, falling back to PostgreSQL topology solver: {}", ex.getMessage());
            }
        }

        // Deterministic Graph Topology Solver on PostgreSQL MAA data
        return calculateTopologyRoute(fromId, toId, blockedIds, objective);
    }

    private RouteResponse queryNeo4jShortestPath(String fromId, String toId, Set<String> blockedIds, String objective) {
        try (Driver driver = GraphDatabase.driver(neo4jUri, AuthTokens.basic(neo4jUsername, neo4jPassword));
             Session session = driver.session()) {

            String cypher = "MATCH (start:HandlingPoint {id: $fromId}), (target:HandlingPoint {id: $toId}) " +
                    "MATCH p = shortestPath((start)-[:CONNECTED_TO*]->(target)) " +
                    "RETURN [n in nodes(p) | n.id] AS nodeIds, " +
                    "reduce(dist = 0.0, r in relationships(p) | dist + r.distanceMeters) AS totalDist, " +
                    "reduce(sec = 0, r in relationships(p) | sec + r.estimatedTimeSeconds) AS totalSec";

            Result result = session.run(cypher, Map.of("fromId", fromId, "toId", toId));

            if (result.hasNext()) {
                Record record = result.next();
                List<Object> nodeIdsRaw = record.get("nodeIds").asList();
                List<String> nodeIds = nodeIdsRaw.stream().map(Object::toString).collect(Collectors.toList());
                double totalDist = record.get("totalDist").asDouble();
                int totalSec = record.get("totalSec").asInt();

                // Check if any edge in path is blocked
                boolean hasBlocked = false;
                for (int i = 0; i < nodeIds.size() - 1; i++) {
                    String edgeKey = nodeIds.get(i) + "->" + nodeIds.get(i + 1);
                    if (blockedIds.contains(edgeKey)) {
                        hasBlocked = true;
                        break;
                    }
                }

                if (!hasBlocked) {
                    RouteResponse response = new RouteResponse();
                    response.setRouteFound(true);
                    response.setOriginPointId(fromId);
                    response.setDestinationPointId(toId);
                    response.setRoutingEngine("NEO4J_CYPHER");
                    response.setOptimizationObjective(objective);
                    response.setTotalDistanceMeters(BigDecimal.valueOf(totalDist).setScale(2, RoundingMode.HALF_UP));
                    response.setEstimatedTraversalSeconds(totalSec);
                    response.setOrderedPath(fetchHandlingPointDtos(nodeIds));
                    response.setEdges(buildRouteEdges(nodeIds, blockedIds));
                    response.setBlockedSegmentsAvoidedCount(blockedIds.size());
                    response.setMessage("Optimal route calculated via Neo4j Graph Cypher engine.");
                    response.setExplanation(generateExplanation(response, objective, blockedIds));
                    return response;
                }
            }
        } catch (Exception e) {
            log.debug("Neo4j connection error during route query: {}", e.getMessage());
        }
        return null;
    }

    private RouteResponse calculateTopologyRoute(String fromId, String toId, Set<String> blockedIds, String objective) {
        List<HandlingPointConnection> allEdges = connectionRepository.findAll();
        Map<String, HandlingPoint> pointsMap = handlingPointRepository.findAll().stream()
                .collect(Collectors.toMap(HandlingPoint::getId, p -> p));

        // Build adjacency map for graph exploration
        Map<String, List<HandlingPointConnection>> adjAll = new HashMap<>();
        for (HandlingPointConnection edge : allEdges) {
            adjAll.computeIfAbsent(edge.getFromPoint().getId(), k -> new ArrayList<>()).add(edge);
        }

        // Find all simple paths from fromId to toId
        List<List<String>> allCandidatePaths = new ArrayList<>();
        findSimplePaths(fromId, toId, adjAll, new LinkedHashSet<>(), allCandidatePaths, 8);

        RouteResponse response = new RouteResponse();
        response.setOriginPointId(fromId);
        response.setDestinationPointId(toId);
        response.setRoutingEngine("MAA_TOPOLOGY_SOLVER");
        response.setOptimizationObjective(objective);
        response.setBlockedSegmentsAvoidedCount(blockedIds.size());

        if (allCandidatePaths.isEmpty()) {
            response.setRouteFound(false);
            response.setMessage("No connecting conveyor route exists between " + fromId + " and " + toId + ".");
            response.setExplanation("No conveyor belts or transfer links connect these two handling points in the airport topology.");
            return response;
        }

        // Evaluate and rank all candidate paths
        List<EvaluatedPath> evaluatedPaths = new ArrayList<>();
        for (List<String> pathNodes : allCandidatePaths) {
            EvaluatedPath ep = evaluatePath(pathNodes, allEdges, pointsMap, blockedIds, objective);
            evaluatedPaths.add(ep);
        }

        // Sort available paths by cost
        List<EvaluatedPath> availablePaths = evaluatedPaths.stream()
                .filter(p -> p.isAvailable)
                .sorted(Comparator.comparingDouble(p -> p.cost))
                .collect(Collectors.toList());

        List<EvaluatedPath> blockedPaths = evaluatedPaths.stream()
                .filter(p -> !p.isAvailable)
                .collect(Collectors.toList());

        if (availablePaths.isEmpty()) {
            response.setRouteFound(false);
            response.setReroutedDueToBlockage(true);
            response.setMessage("No valid route is currently available between the selected locations due to conveyor stoppages.");
            response.setExplanation("All " + evaluatedPaths.size() + " candidate paths pass through one or more blocked conveyor segments (" +
                    String.join(", ", blockedIds) + "). Please unblock a conveyor belt to restore transit flow.");

            // Build alternative DTOs to display blocked candidates
            List<RouteResponse.AlternativeRouteDto> altDtos = new ArrayList<>();
            char routeLetter = 'A';
            for (EvaluatedPath bp : blockedPaths) {
                RouteResponse.AlternativeRouteDto alt = new RouteResponse.AlternativeRouteDto();
                alt.setRouteId("ROUTE_" + routeLetter);
                alt.setLabel("Route " + routeLetter + " — Blocked");
                alt.setRecommended(false);
                alt.setAvailable(false);
                alt.setOrderedPath(fetchHandlingPointDtos(bp.nodes));
                alt.setEdges(buildRouteEdges(bp.nodes, blockedIds));
                alt.setTotalDistanceMeters(BigDecimal.valueOf(bp.totalDistance).setScale(2, RoundingMode.HALF_UP));
                alt.setEstimatedTraversalSeconds((int) bp.totalSeconds);
                alt.setDescription("Unavailable: Contains blocked conveyor belt.");
                altDtos.add(alt);
                routeLetter++;
            }
            response.setAlternatives(altDtos);
            return response;
        }

        // The best available path is recommended
        EvaluatedPath primary = availablePaths.get(0);
        response.setRouteFound(true);
        response.setTotalDistanceMeters(BigDecimal.valueOf(primary.totalDistance).setScale(2, RoundingMode.HALF_UP));
        response.setEstimatedTraversalSeconds((int) primary.totalSeconds);
        response.setOrderedPath(fetchHandlingPointDtos(primary.nodes));
        response.setEdges(buildRouteEdges(primary.nodes, blockedIds));
        response.setReroutedDueToBlockage(!blockedIds.isEmpty());

        // Build alternatives list (top 3 candidates)
        List<RouteResponse.AlternativeRouteDto> alternatives = new ArrayList<>();
        char routeLetter = 'A';
        for (int i = 0; i < availablePaths.size() && i < 3; i++) {
            EvaluatedPath ep = availablePaths.get(i);
            RouteResponse.AlternativeRouteDto alt = new RouteResponse.AlternativeRouteDto();
            alt.setRouteId("ROUTE_" + routeLetter);
            alt.setLabel(i == 0 ? "Route A — Recommended" : "Route " + routeLetter + " — Alternative " + i);
            alt.setRecommended(i == 0);
            alt.setAvailable(true);
            alt.setOrderedPath(fetchHandlingPointDtos(ep.nodes));
            alt.setEdges(buildRouteEdges(ep.nodes, blockedIds));
            alt.setTotalDistanceMeters(BigDecimal.valueOf(ep.totalDistance).setScale(2, RoundingMode.HALF_UP));
            alt.setEstimatedTraversalSeconds((int) ep.totalSeconds);
            alt.setDeltaDistanceMeters(BigDecimal.valueOf(ep.totalDistance - primary.totalDistance).setScale(2, RoundingMode.HALF_UP));
            alt.setDeltaSeconds((int) (ep.totalSeconds - primary.totalSeconds));
            alt.setDescription(i == 0
                    ? "Optimal route based on " + getObjectiveLabel(objective) + "."
                    : String.format("+%.1fm, +%ds compared to recommended route.", ep.totalDistance - primary.totalDistance, (int)(ep.totalSeconds - primary.totalSeconds)));
            alternatives.add(alt);
            routeLetter++;
        }

        // Add any blocked alternative if room permits
        for (EvaluatedPath bp : blockedPaths) {
            if (alternatives.size() >= 3) break;
            RouteResponse.AlternativeRouteDto alt = new RouteResponse.AlternativeRouteDto();
            alt.setRouteId("ROUTE_" + routeLetter);
            alt.setLabel("Route " + routeLetter + " — Unavailable");
            alt.setRecommended(false);
            alt.setAvailable(false);
            alt.setOrderedPath(fetchHandlingPointDtos(bp.nodes));
            alt.setEdges(buildRouteEdges(bp.nodes, blockedIds));
            alt.setTotalDistanceMeters(BigDecimal.valueOf(bp.totalDistance).setScale(2, RoundingMode.HALF_UP));
            alt.setEstimatedTraversalSeconds((int) bp.totalSeconds);
            alt.setDescription("Blocked: Conveyor segment in this path is currently halted.");
            alternatives.add(alt);
            routeLetter++;
        }

        response.setAlternatives(alternatives);

        // Generate human-friendly message & explanation
        String objectiveLabel = getObjectiveLabel(objective);
        if (!blockedIds.isEmpty()) {
            response.setMessage("Alternative route calculated avoiding " + blockedIds.size() + " blocked belt(s) for " + objectiveLabel + ".");
        } else {
            response.setMessage("Optimal baggage route calculated for " + objectiveLabel + ".");
        }
        response.setExplanation(generateExplanation(response, objective, blockedIds));

        return response;
    }

    private void findSimplePaths(String current, String target,
                                 Map<String, List<HandlingPointConnection>> adj,
                                 Set<String> visited,
                                 List<List<String>> result,
                                 int maxDepth) {
        if (visited.size() > maxDepth) return;
        visited.add(current);

        if (current.equals(target)) {
            result.add(new ArrayList<>(visited));
        } else {
            List<HandlingPointConnection> edges = adj.getOrDefault(current, Collections.emptyList());
            for (HandlingPointConnection edge : edges) {
                String next = edge.getToPoint().getId();
                if (!visited.contains(next) && edge.isActive()) {
                    findSimplePaths(next, target, adj, visited, result, maxDepth);
                }
            }
        }

        visited.remove(current);
    }

    private EvaluatedPath evaluatePath(List<String> nodes,
                                       List<HandlingPointConnection> allEdges,
                                       Map<String, HandlingPoint> pointsMap,
                                       Set<String> blockedIds,
                                       String objective) {
        Map<String, HandlingPointConnection> edgeLookup = new HashMap<>();
        for (HandlingPointConnection e : allEdges) {
            edgeLookup.put(e.getFromPoint().getId() + "->" + e.getToPoint().getId(), e);
        }

        double totalDist = 0.0;
        double totalSec = 0.0;
        boolean isAvailable = true;
        double cost = 0.0;

        for (int i = 0; i < nodes.size() - 1; i++) {
            String from = nodes.get(i);
            String to = nodes.get(i + 1);
            String key = from + "->" + to;

            if (blockedIds.contains(key)) {
                isAvailable = false;
            }

            HandlingPointConnection conn = edgeLookup.get(key);
            double dist = conn != null ? conn.getDistanceMeters().doubleValue() : 100.0;
            double sec = conn != null ? conn.getEstimatedTraversalSeconds() : 60.0;
            totalDist += dist;
            totalSec += sec;

            HandlingPoint destPoint = pointsMap.get(to);
            int capacity = destPoint != null ? destPoint.getCapacityPerHour() : 1000;
            boolean isMaintenance = destPoint != null && "MAINTENANCE".equalsIgnoreCase(destPoint.getOperationalStatus());
            boolean isDegraded = destPoint != null && "DEGRADED".equalsIgnoreCase(destPoint.getOperationalStatus());

            // Multi-objective cost functions:
            switch (objective) {
                case "TIME":
                    // Fastest Travel Time
                    cost += sec;
                    break;
                case "CONGESTION":
                    // Avoid Congested Conveyors: penalty for lower throughput capacity
                    double congestionPenalty = Math.max(1.0, 1500.0 / Math.max(capacity, 200));
                    cost += sec * congestionPenalty;
                    break;
                case "MAINTENANCE":
                    // Avoid Maintenance Areas: high penalty for maintenance or degraded handling points
                    double maintenancePenalty = isMaintenance ? 50000.0 : (isDegraded ? 10000.0 : 0.0);
                    cost += dist + maintenancePenalty;
                    break;
                case "BALANCED":
                    // Balanced Route: normalized distance + normalized time + status cost
                    double normDist = dist / 100.0;
                    double normTime = sec / 60.0;
                    double statusPenalty = isMaintenance ? 20.0 : (isDegraded ? 5.0 : 0.0);
                    cost += (0.5 * normDist) + (0.5 * normTime) + statusPenalty;
                    break;
                case "DISTANCE":
                default:
                    // Shortest Conveyor Distance
                    cost += dist;
                    break;
            }
        }

        return new EvaluatedPath(nodes, totalDist, totalSec, isAvailable, cost);
    }

    private String getObjectiveLabel(String objective) {
        switch (objective) {
            case "TIME": return "Fastest Travel Time";
            case "CONGESTION": return "Congestion Avoidance";
            case "MAINTENANCE": return "Maintenance Area Avoidance";
            case "BALANCED": return "Balanced Distance & Travel Time";
            case "DISTANCE":
            default:
                return "Shortest Conveyor Distance";
        }
    }

    private String generateExplanation(RouteResponse response, String objective, Set<String> blockedIds) {
        if (!response.isRouteFound()) {
            return "No valid conveyor path is currently operational between " + response.getOriginPointId() + " and " + response.getDestinationPointId() + ".";
        }

        int pointsCount = response.getOrderedPath() != null ? response.getOrderedPath().size() : 0;
        int segmentsCount = response.getEdges() != null ? response.getEdges().size() : 0;
        double dist = response.getTotalDistanceMeters() != null ? response.getTotalDistanceMeters().doubleValue() : 0.0;
        int sec = response.getEstimatedTraversalSeconds();
        int minutes = sec / 60;
        int remainingSec = sec % 60;
        String timeStr = minutes > 0 ? (minutes + " min " + (remainingSec > 0 ? remainingSec + " sec" : "")) : (sec + " seconds");

        StringBuilder sb = new StringBuilder();
        sb.append("Recommended because this path achieves the optimal result for ").append(getObjectiveLabel(objective));
        sb.append(" among all valid candidate routes. ");
        sb.append("It covers ").append(String.format("%.1f", dist)).append(" meters across ")
          .append(pointsCount).append(" handling locations (").append(segmentsCount).append(" conveyor segments), ")
          .append("with an estimated traversal time of ").append(timeStr).append(". ");

        if (!blockedIds.isEmpty()) {
            sb.append("This route successfully diverts around ").append(blockedIds.size())
              .append(" simulated belt stoppage(s) (").append(String.join(", ", blockedIds)).append(") using automated sorting bypass channels.");
        } else {
            sb.append("All primary conveyor belts and screening spurs along this path are fully operational.");
        }

        return sb.toString();
    }

    private List<HandlingPointDto> fetchHandlingPointDtos(List<String> nodeIds) {
        List<HandlingPoint> points = handlingPointRepository.findAllById(nodeIds);
        Map<String, HandlingPoint> map = points.stream().collect(Collectors.toMap(HandlingPoint::getId, p -> p));

        List<HandlingPointDto> result = new ArrayList<>();
        for (String id : nodeIds) {
            HandlingPoint p = map.get(id);
            if (p != null) {
                result.add(new HandlingPointDto(p.getId(), p.getName(), p.getCategory(), p.getZone(), p.getOperationalStatus(), p.getCapacityPerHour()));
            }
        }
        return result;
    }

    private List<RouteResponse.RouteEdgeDto> buildRouteEdges(List<String> nodeIds, Set<String> blockedIds) {
        List<RouteResponse.RouteEdgeDto> list = new ArrayList<>();
        for (int i = 0; i < nodeIds.size() - 1; i++) {
            String from = nodeIds.get(i);
            String to = nodeIds.get(i + 1);
            String edgeKey = from + "->" + to;
            boolean isBlocked = blockedIds.contains(edgeKey);

            Optional<HandlingPointConnection> conn = connectionRepository.findByFromPointIdAndToPointId(from, to);
            if (conn.isPresent()) {
                HandlingPointConnection c = conn.get();
                String status = isBlocked ? "BLOCKED" : (c.isActive() ? "HEALTHY" : "INACTIVE");
                list.add(new RouteResponse.RouteEdgeDto(
                        from, to,
                        c.getFromPoint().getName(),
                        c.getToPoint().getName(),
                        c.getDistanceMeters(),
                        c.getEstimatedTraversalSeconds(),
                        !isBlocked && c.isActive(),
                        status,
                        c.getRestrictionNotes()
                ));
            } else {
                list.add(new RouteResponse.RouteEdgeDto(from, to, BigDecimal.valueOf(100.0), 60, !isBlocked));
            }
        }
        return list;
    }

    private static class EvaluatedPath {
        List<String> nodes;
        double totalDistance;
        double totalSeconds;
        boolean isAvailable;
        double cost;

        EvaluatedPath(List<String> nodes, double totalDistance, double totalSeconds, boolean isAvailable, double cost) {
            this.nodes = nodes;
            this.totalDistance = totalDistance;
            this.totalSeconds = totalSeconds;
            this.isAvailable = isAvailable;
            this.cost = cost;
        }
    }
}
