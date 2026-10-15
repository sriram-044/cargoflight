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
    public RouteResponse calculateRoute(RouteCalculationRequest request) {
        String fromId = request.getOriginPointId();
        String toId = request.getDestinationPointId();
        Set<String> blockedIds = request.getBlockedConnectionIds() != null
                ? new HashSet<>(request.getBlockedConnectionIds())
                : Collections.emptySet();

        // Validate points exist
        if (!handlingPointRepository.existsById(fromId)) {
            throw new ResourceNotFoundException("Origin handling point not found: " + fromId);
        }
        if (!handlingPointRepository.existsById(toId)) {
            throw new ResourceNotFoundException("Destination handling point not found: " + toId);
        }

        // Try Neo4j if configured and enabled
        if (neo4jEnabled) {
            try {
                RouteResponse neo4jResponse = queryNeo4jShortestPath(fromId, toId, blockedIds);
                if (neo4jResponse != null && neo4jResponse.isRouteFound()) {
                    return neo4jResponse;
                }
            } catch (Exception ex) {
                log.warn("Neo4j shortest path query failed, falling back to PostgreSQL topology solver: {}", ex.getMessage());
            }
        }

        // Deterministic Fallback: Dijkstra Shortest Path on MAA PostgreSQL Graph Topology
        String objective = request.getOptimizationObjective() != null ? request.getOptimizationObjective() : "DISTANCE";
        return calculateDijkstraShortestPath(fromId, toId, blockedIds, objective);
    }

    private RouteResponse queryNeo4jShortestPath(String fromId, String toId, Set<String> blockedIds) {
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
                    response.setTotalDistanceMeters(BigDecimal.valueOf(totalDist));
                    response.setEstimatedTraversalSeconds(totalSec);
                    response.setOrderedPath(fetchHandlingPointDtos(nodeIds));
                    response.setEdges(buildRouteEdges(nodeIds, blockedIds));
                    response.setMessage("Optimal route calculated via Neo4j Graph Cypher engine.");
                    return response;
                }
            }
        } catch (Exception e) {
            log.debug("Neo4j connection error during route query: {}", e.getMessage());
        }
        return null;
    }

    private RouteResponse calculateDijkstraShortestPath(String fromId, String toId, Set<String> blockedIds, String objective) {
        List<HandlingPointConnection> allEdges = connectionRepository.findAll();

        // Build adjacency map (considering active edges and blocked overrides)
        Map<String, List<HandlingPointConnection>> adj = new HashMap<>();
        for (HandlingPointConnection edge : allEdges) {
            String edgeKey = edge.getFromPoint().getId() + "->" + edge.getToPoint().getId();
            if (edge.isActive() && !blockedIds.contains(edgeKey)) {
                adj.computeIfAbsent(edge.getFromPoint().getId(), k -> new ArrayList<>()).add(edge);
            }
        }

        // Dijkstra's algorithm weighted by selected objective (DISTANCE vs TIME)
        boolean optimizeTime = "TIME".equalsIgnoreCase(objective);
        Map<String, Double> costs = new HashMap<>();
        Map<String, String> previous = new HashMap<>();
        Map<String, HandlingPointConnection> prevEdge = new HashMap<>();
        PriorityQueue<NodeDistance> pq = new PriorityQueue<>(Comparator.comparingDouble(nd -> nd.distance));

        costs.put(fromId, 0.0);
        pq.add(new NodeDistance(fromId, 0.0));

        while (!pq.isEmpty()) {
            NodeDistance current = pq.poll();
            String u = current.nodeId;

            if (u.equals(toId)) break;
            if (current.distance > costs.getOrDefault(u, Double.MAX_VALUE)) continue;

            List<HandlingPointConnection> neighbors = adj.getOrDefault(u, Collections.emptyList());
            for (HandlingPointConnection edge : neighbors) {
                String v = edge.getToPoint().getId();
                double weight = optimizeTime
                        ? (double) edge.getEstimatedTraversalSeconds()
                        : edge.getDistanceMeters().doubleValue();
                double newCost = costs.get(u) + weight;

                if (newCost < costs.getOrDefault(v, Double.MAX_VALUE)) {
                    costs.put(v, newCost);
                    previous.put(v, u);
                    prevEdge.put(v, edge);
                    pq.add(new NodeDistance(v, newCost));
                }
            }
        }

        RouteResponse response = new RouteResponse();
        response.setOriginPointId(fromId);
        response.setDestinationPointId(toId);
        response.setRoutingEngine("MAA_TOPOLOGY_SOLVER");

        if (!costs.containsKey(toId) || costs.get(toId) == Double.MAX_VALUE) {
            response.setRouteFound(false);
            response.setOrderedPath(Collections.emptyList());
            response.setEdges(Collections.emptyList());
            response.setMessage("No valid operational route exists between " + fromId + " and " + toId +
                    (blockedIds.isEmpty() ? "." : " due to active connection blockages."));
            return response;
        }

        // Reconstruct path
        LinkedList<String> path = new LinkedList<>();
        String step = toId;
        int totalSec = 0;
        double totalDist = 0.0;
        while (step != null) {
            path.addFirst(step);
            HandlingPointConnection edge = prevEdge.get(step);
            if (edge != null) {
                totalSec += edge.getEstimatedTraversalSeconds();
                totalDist += edge.getDistanceMeters().doubleValue();
            }
            step = previous.get(step);
        }

        response.setRouteFound(true);
        response.setTotalDistanceMeters(BigDecimal.valueOf(totalDist));
        response.setEstimatedTraversalSeconds(totalSec);
        response.setOrderedPath(fetchHandlingPointDtos(path));
        response.setEdges(buildRouteEdges(path, blockedIds));
        response.setReroutedDueToBlockage(!blockedIds.isEmpty());
        String objectiveLabel = optimizeTime ? "fastest travel time (" + totalSec + "s)" : "shortest distance (" + totalDist + "m)";
        response.setMessage(!blockedIds.isEmpty()
                ? "Alternative route calculated avoiding " + blockedIds.size() + " blocked segment(s) optimizing for " + objectiveLabel + "."
                : "Optimal baggage route computed via handling topology for " + objectiveLabel + ".");

        return response;
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
            Optional<HandlingPointConnection> conn = connectionRepository.findByFromPointIdAndToPointId(from, to);
            if (conn.isPresent()) {
                HandlingPointConnection c = conn.get();
                list.add(new RouteResponse.RouteEdgeDto(from, to, c.getDistanceMeters(), c.getEstimatedTraversalSeconds(), c.isActive()));
            } else {
                list.add(new RouteResponse.RouteEdgeDto(from, to, BigDecimal.valueOf(100.0), 60, true));
            }
        }
        return list;
    }

    private static class NodeDistance {
        String nodeId;
        double distance;
        NodeDistance(String nodeId, double distance) {
            this.nodeId = nodeId;
            this.distance = distance;
        }
    }
}
