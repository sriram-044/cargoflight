package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.entity.AuditLog;
import com.aerotrace.maa.entity.User;
import com.aerotrace.maa.repository.AuditLogRepository;
import com.aerotrace.maa.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'DATABASE_ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository,
                           AuditLogRepository auditLogRepository,
                           org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Hide password hashes in response
        users.forEach(u -> u.setPasswordHash("[PROTECTED]"));
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @org.springframework.web.bind.annotation.PostMapping("/users")
    public ResponseEntity<ApiResponse<User>> createUser(
            @RequestBody java.util.Map<String, String> payload,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.aerotrace.maa.security.UserPrincipal admin) {
        String username = payload.get("username");
        String email = payload.get("email");
        String fullName = payload.get("fullName");
        String role = payload.getOrDefault("role", "BAGGAGE_HANDLER");
        String password = payload.getOrDefault("password", "Aerotrace@2026");

        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (userRepository.findByUsername(username.trim()).isPresent()) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }

        User user = new User();
        user.setUsername(username.trim());
        user.setEmail(email != null ? email.trim() : username.trim() + "@cargoflight.aero");
        user.setFullName(fullName != null ? fullName.trim() : username.trim());
        user.setRole(role.trim().toUpperCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setActive(true);

        User saved = userRepository.save(user);
        saved.setPasswordHash("[PROTECTED]");

        auditLogRepository.save(new AuditLog(
                admin != null ? admin.getUsername() : "system",
                "USER_CREATED",
                "User",
                saved.getId().toString(),
                "Operator account created with role " + saved.getRole(),
                "admin-console"
        ));

        return ResponseEntity.ok(ApiResponse.ok("User created successfully", saved));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<User>> toggleUserStatus(
            @org.springframework.web.bind.annotation.PathVariable("id") Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.aerotrace.maa.security.UserPrincipal admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.aerotrace.maa.exception.ResourceNotFoundException("User not found with id: " + id));

        user.setActive(!user.isActive());
        user.setUpdatedAt(java.time.OffsetDateTime.now());
        User saved = userRepository.save(user);
        saved.setPasswordHash("[PROTECTED]");

        auditLogRepository.save(new AuditLog(
                admin != null ? admin.getUsername() : "system",
                "USER_STATUS_TOGGLED",
                "User",
                saved.getId().toString(),
                "User status changed to " + (saved.isActive() ? "ACTIVE" : "SUSPENDED"),
                "admin-console"
        ));

        return ResponseEntity.ok(ApiResponse.ok("User status updated", saved));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<User>> updateUserRole(
            @org.springframework.web.bind.annotation.PathVariable("id") Long id,
            @RequestBody java.util.Map<String, String> payload,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.aerotrace.maa.security.UserPrincipal admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.aerotrace.maa.exception.ResourceNotFoundException("User not found with id: " + id));

        String newRole = payload.get("role");
        if (newRole != null && !newRole.trim().isEmpty()) {
            user.setRole(newRole.trim().toUpperCase());
            user.setUpdatedAt(java.time.OffsetDateTime.now());
            User saved = userRepository.save(user);
            saved.setPasswordHash("[PROTECTED]");

            auditLogRepository.save(new AuditLog(
                    admin != null ? admin.getUsername() : "system",
                    "USER_ROLE_UPDATED",
                    "User",
                    saved.getId().toString(),
                    "User role changed to " + saved.getRole(),
                    "admin-console"
            ));

            return ResponseEntity.ok(ApiResponse.ok("User role updated", saved));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Role is required"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "25") int size) {
        Page<AuditLog> logs = auditLogRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
