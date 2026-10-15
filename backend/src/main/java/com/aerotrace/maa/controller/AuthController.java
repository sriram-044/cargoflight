package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.AuthRequest;
import com.aerotrace.maa.dto.AuthResponse;
import com.aerotrace.maa.security.UserPrincipal;
import com.aerotrace.maa.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    @org.springframework.beans.factory.annotation.Value("${aerotrace.demo-mode.enabled:true}")
    private boolean demoModeEnabled;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/demo-session")
    public ResponseEntity<ApiResponse<AuthResponse>> getDemoSession(HttpServletRequest servletRequest) {
        if (!demoModeEnabled) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Demo session is disabled in this environment."));
        }
        String clientIp = servletRequest.getRemoteAddr();
        AuthResponse response = authService.createDemoSession(clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Demo session established", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request, HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        AuthResponse response = authService.authenticate(request, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Authentication successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Object>> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.ok(ApiResponse.ok("Anonymous", null));
        }
        return ResponseEntity.ok(ApiResponse.ok(userPrincipal));
    }
}
