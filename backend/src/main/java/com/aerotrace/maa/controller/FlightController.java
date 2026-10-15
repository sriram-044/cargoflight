package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.FlightResponse;
import com.aerotrace.maa.service.FlightService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/flights")
public class FlightController {

    private final FlightService flightService;

    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FlightResponse>>> getAllFlights() {
        List<FlightResponse> flights = flightService.getAllMaaFlights();
        return ResponseEntity.ok(ApiResponse.ok(flights));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FlightResponse>> getFlightById(@PathVariable("id") Long id) {
        FlightResponse flight = flightService.getFlightById(id);
        return ResponseEntity.ok(ApiResponse.ok(flight));
    }

    @GetMapping("/{id}/baggage")
    public ResponseEntity<ApiResponse<List<com.aerotrace.maa.dto.BaggageResponse>>> getFlightBaggage(@PathVariable("id") Long id) {
        List<com.aerotrace.maa.dto.BaggageResponse> baggage = flightService.getFlightBaggage(id);
        return ResponseEntity.ok(ApiResponse.ok(baggage));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'FLIGHT_OPERATOR')")
    public ResponseEntity<ApiResponse<FlightResponse>> createFlight(
            @RequestBody com.aerotrace.maa.entity.Flight flight,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.aerotrace.maa.security.UserPrincipal currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "system";
        FlightResponse created = flightService.createFlight(flight, username);
        return ResponseEntity.ok(ApiResponse.ok("Flight scheduled successfully", created));
    }

    @PatchMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'FLIGHT_OPERATOR')")
    public ResponseEntity<ApiResponse<FlightResponse>> updateFlightStatus(
            @PathVariable("id") Long id,
            @RequestBody java.util.Map<String, String> payload,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.aerotrace.maa.security.UserPrincipal currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "system";
        String status = payload.getOrDefault("status", "SCHEDULED");
        FlightResponse updated = flightService.updateFlightStatus(id, status, username);
        return ResponseEntity.ok(ApiResponse.ok("Flight status updated", updated));
    }
}
