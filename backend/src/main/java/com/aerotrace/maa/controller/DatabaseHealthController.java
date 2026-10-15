package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.DatabaseHealthDto;
import com.aerotrace.maa.service.DatabaseHealthService;
import com.aerotrace.maa.service.SyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/database-center")
public class DatabaseHealthController {

    private final DatabaseHealthService databaseHealthService;
    private final SyncService syncService;

    public DatabaseHealthController(DatabaseHealthService databaseHealthService, SyncService syncService) {
        this.databaseHealthService = databaseHealthService;
        this.syncService = syncService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<DatabaseHealthDto>> getDatabaseStatuses() {
        DatabaseHealthDto health = databaseHealthService.checkAllDatabases();
        return ResponseEntity.ok(ApiResponse.ok(health));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'DATABASE_ADMIN')")
    public ResponseEntity<ApiResponse<SyncService.SyncResult>> triggerSecondarySync() {
        SyncService.SyncResult result = syncService.synchronizeToSecondary();
        return ResponseEntity.ok(ApiResponse.ok(result.getMessage(), result));
    }
}
