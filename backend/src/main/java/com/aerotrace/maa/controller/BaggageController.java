package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.BaggageRegistrationRequest;
import com.aerotrace.maa.dto.BaggageResponse;
import com.aerotrace.maa.security.UserPrincipal;
import com.aerotrace.maa.service.BaggageService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/baggage")
public class BaggageController {

    private final BaggageService baggageService;

    public BaggageController(BaggageService baggageService) {
        this.baggageService = baggageService;
    }

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'BAGGAGE_HANDLER')")
    public ResponseEntity<ApiResponse<BaggageResponse>> registerBaggage(
            @Valid @RequestBody BaggageRegistrationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "system";
        BaggageResponse response = baggageService.registerBaggage(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Baggage registered successfully with tag: " + response.getBaggageTag(), response));
    }

    @PostMapping("/{tag}/transition")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'BAGGAGE_HANDLER')")
    public ResponseEntity<ApiResponse<BaggageResponse>> transitionBaggage(
            @PathVariable("tag") String tag,
            @Valid @RequestBody com.aerotrace.maa.dto.BaggageTransitionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "system";
        BaggageResponse response = baggageService.transitionStatus(tag, request, username);
        return ResponseEntity.ok(ApiResponse.ok("Baggage transition recorded successfully", response));
    }

    @GetMapping("/{tag}")
    public ResponseEntity<ApiResponse<BaggageResponse>> getBaggageByTag(@PathVariable("tag") String tag) {
        BaggageResponse response = baggageService.getByTag(tag);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BaggageResponse>>> getAllBaggage(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "flightId", required = false) Long flightId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "registeredAt,desc") String sort) {
        return searchBaggage(query, status, flightId, page, size, sort);
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BaggageResponse>>> searchBaggage(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "flightId", required = false) Long flightId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "registeredAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1])
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortParts[0]));

        Page<BaggageResponse> result = baggageService.searchBaggage(query, status, flightId, pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
