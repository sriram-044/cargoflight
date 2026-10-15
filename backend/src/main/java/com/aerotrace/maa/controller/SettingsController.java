package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.entity.SystemSetting;
import com.aerotrace.maa.security.UserPrincipal;
import com.aerotrace.maa.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemSetting>>> getAllSettings() {
        List<SystemSetting> settings = settingsService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @GetMapping("/map")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSettingsMap() {
        return ResponseEntity.ok(ApiResponse.ok(settingsService.getSettingsAsMap()));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateSettings(
            @RequestBody Map<String, String> updates,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "system";
        Map<String, String> result = settingsService.updateSettingsBatch(updates, username);
        return ResponseEntity.ok(ApiResponse.ok("Settings updated successfully", result));
    }

    @PatchMapping("/{key}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER')")
    public ResponseEntity<ApiResponse<SystemSetting>> updateSingleSetting(
            @PathVariable("key") String key,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String value = body.get("value");
        if (value == null) {
            value = body.get("settingValue");
        }
        if (value == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing 'value' field in payload"));
        }
        String username = currentUser != null ? currentUser.getUsername() : "system";
        SystemSetting updated = settingsService.updateSetting(key, value, username);
        return ResponseEntity.ok(ApiResponse.ok("Setting updated", updated));
    }
}
