package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.HandlingPointDto;
import com.aerotrace.maa.service.HandlingPointService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/handling-points")
public class HandlingPointController {

    private final HandlingPointService handlingPointService;

    public HandlingPointController(HandlingPointService handlingPointService) {
        this.handlingPointService = handlingPointService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HandlingPointDto>>> getAllHandlingPoints() {
        List<HandlingPointDto> points = handlingPointService.getAllHandlingPoints();
        return ResponseEntity.ok(ApiResponse.ok(points));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER')")
    public ResponseEntity<ApiResponse<HandlingPointDto>> updateHandlingPointStatus(
            @PathVariable("id") String id,
            @RequestBody Map<String, String> body) {
        String newStatus = body.getOrDefault("status", "ACTIVE");
        HandlingPointDto updated = handlingPointService.updateStatus(id, newStatus);
        return ResponseEntity.ok(ApiResponse.ok("Handling point status updated", updated));
    }
}
