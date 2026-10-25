package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.security.UserPrincipal;
import com.aerotrace.maa.service.WarehouseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/warehouse")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @PostMapping("/refresh")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'DATABASE_ADMIN', 'ANALYST')")
    public ResponseEntity<ApiResponse<WarehouseService.WarehouseRefreshResult>> triggerWarehouseRefresh(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "system";
        WarehouseService.WarehouseRefreshResult result = warehouseService.refreshWarehouse(username);
        return ResponseEntity.ok(ApiResponse.ok(result.getMessage(), result));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<WarehouseService.WarehouseStatusDto>> getWarehouseStatus() {
        WarehouseService.WarehouseStatusDto status = warehouseService.getWarehouseStatus();
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWarehouseMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("status", warehouseService.getWarehouseStatus());
        metrics.put("volumeByTerminal", warehouseService.getTerminalVolumeOlap());
        metrics.put("flightPerformance", warehouseService.getFlightPerformanceOlap());
        metrics.put("durationByStage", warehouseService.getStageDurationOlap());
        return ResponseEntity.ok(ApiResponse.ok(metrics));
    }

    @GetMapping("/olap/terminals")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTerminalVolumeOlap() {
        List<Map<String, Object>> data = warehouseService.getTerminalVolumeOlap();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/olap/flights")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFlightPerformanceOlap() {
        List<Map<String, Object>> data = warehouseService.getFlightPerformanceOlap();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/olap/stages")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStageDurationOlap() {
        List<Map<String, Object>> data = warehouseService.getStageDurationOlap();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
