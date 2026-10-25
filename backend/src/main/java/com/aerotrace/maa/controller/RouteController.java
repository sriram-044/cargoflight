package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.HandlingPointDto;
import com.aerotrace.maa.dto.RouteCalculationRequest;
import com.aerotrace.maa.dto.RouteResponse;
import com.aerotrace.maa.entity.HandlingPointConnection;
import com.aerotrace.maa.repository.HandlingPointConnectionRepository;
import com.aerotrace.maa.service.RouteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/routes", "/api/routes"})
public class RouteController {

    private final RouteService routeService;
    private final HandlingPointConnectionRepository connectionRepository;

    public RouteController(RouteService routeService,
                           HandlingPointConnectionRepository connectionRepository) {
        this.routeService = routeService;
        this.connectionRepository = connectionRepository;
    }

    /**
     * Primary route calculation endpoint
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<RouteResponse>> calculateRoute(@Valid @RequestBody RouteCalculationRequest request) {
        RouteResponse response = routeService.calculateRoute(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Recalculate route alias endpoint
     */
    @PostMapping("/recalculate")
    public ResponseEntity<ApiResponse<RouteResponse>> recalculateRoute(@Valid @RequestBody RouteCalculationRequest request) {
        RouteResponse response = routeService.calculateRoute(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Retrieve all available baggage handling locations
     */
    @GetMapping("/locations")
    public ResponseEntity<ApiResponse<List<HandlingPointDto>>> getLocations() {
        List<HandlingPointDto> locations = routeService.getAllLocations();
        return ResponseEntity.ok(ApiResponse.ok(locations));
    }

    /**
     * Retrieve alternative candidate routes
     */
    @PostMapping("/alternatives")
    public ResponseEntity<ApiResponse<List<RouteResponse.AlternativeRouteDto>>> getAlternativesPost(@Valid @RequestBody RouteCalculationRequest request) {
        RouteResponse response = routeService.calculateRoute(request);
        return ResponseEntity.ok(ApiResponse.ok(response.getAlternatives()));
    }

    @GetMapping("/alternatives")
    public ResponseEntity<ApiResponse<List<RouteResponse.AlternativeRouteDto>>> getAlternativesGet(
            @RequestParam String originId,
            @RequestParam String destinationId,
            @RequestParam(required = false, defaultValue = "DISTANCE") String objective) {
        RouteCalculationRequest req = new RouteCalculationRequest(originId, destinationId, objective);
        RouteResponse response = routeService.calculateRoute(req);
        return ResponseEntity.ok(ApiResponse.ok(response.getAlternatives()));
    }

    /**
     * Inspect individual conveyor segment telemetry by numeric ID
     */
    @GetMapping("/segments/{id}")
    public ResponseEntity<ApiResponse<RouteResponse.RouteEdgeDto>> getSegmentById(@PathVariable Long id) {
        RouteResponse.RouteEdgeDto edge = routeService.getSegmentDetailsById(id);
        return ResponseEntity.ok(ApiResponse.ok(edge));
    }

    /**
     * Inspect individual conveyor segment telemetry by fromPoint and toPoint IDs
     */
    @GetMapping("/connections/{fromId}/{toId}")
    public ResponseEntity<ApiResponse<RouteResponse.RouteEdgeDto>> getSegmentByPoints(
            @PathVariable String fromId,
            @PathVariable String toId) {
        RouteResponse.RouteEdgeDto edge = routeService.getSegmentDetails(fromId, toId);
        return ResponseEntity.ok(ApiResponse.ok(edge));
    }

    /**
     * Full airport conveyor topology network
     */
    @GetMapping("/topology")
    public ResponseEntity<ApiResponse<List<HandlingPointConnection>>> getTopologyConnections() {
        List<HandlingPointConnection> connections = connectionRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok(connections));
    }
}
