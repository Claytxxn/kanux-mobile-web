package com.kanux.controller;

import com.kanux.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Value("${supabase.jwt-secret:NOT_SET}")
    private String jwtSecret;

    private final JwtService jwtService;

    public HealthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    /** Public health check — use to verify backend is online and JWT secret is configured. */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("status", "ok");
        info.put("jwtSecretConfigured", jwtSecret != null && !jwtSecret.equals("NOT_SET") && jwtSecret.length() > 10);
        info.put("jwtSecretLength", jwtSecret == null ? 0 : jwtSecret.length());
        String algo = jwtService.getResolvedAlgo();
        info.put("jwtAlgorithm", algo != null ? algo : "not-yet-resolved");
        return ResponseEntity.ok(info);
    }

    /**
     * Debug endpoint: validates a Bearer token without requiring auth.
     * POST /api/debug/jwt  body: { "token": "..." }
     */
    @PostMapping("/api/debug/jwt")
    public ResponseEntity<Map<String, Object>> debugJwt(@RequestBody Map<String, String> body) {
        Map<String, Object> result = new LinkedHashMap<>();
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            result.put("error", "token is required");
            return ResponseEntity.badRequest().body(result);
        }
        try {
            var claims = jwtService.getClaims(token);
            result.put("valid", true);
            result.put("sub", claims.getSubject());
            result.put("email", claims.get("email"));
            result.put("role", claims.get("role"));
            result.put("exp", claims.getExpiration());
        } catch (Exception e) {
            result.put("valid", false);
            result.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        return ResponseEntity.ok(result);
    }
}
