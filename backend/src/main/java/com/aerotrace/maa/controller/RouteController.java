package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
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
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;
    private final HandlingPointConnectionRepository connectionRepository;

    public RouteController(RouteService routeService,
                           HandlingPointConnectionRepository connectionRepository) {
        this.routeService = routeService;
        this.connectionRepository = connectionRepository;
    }

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<RouteResponse>> calculateRoute(@Valid @RequestBody RouteCalculationRequest request) {
        RouteResponse response = routeService.calculateRoute(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/topology")
    public ResponseEntity<ApiResponse<List<HandlingPointConnection>>> getTopologyConnections() {
        List<HandlingPointConnection> connections = connectionRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok(connections));
    }
}
