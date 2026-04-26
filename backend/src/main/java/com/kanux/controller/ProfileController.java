package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.dto.UpdateProfileRequest;
import com.kanux.entity.UserProfile;
import com.kanux.repository.UserProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserProfileRepository userProfileRepository;

    public ProfileController(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfile>> getProfile(@AuthenticationPrincipal UserProfile p) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        return ResponseEntity.ok(ApiResponse.ok(p));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(
            @AuthenticationPrincipal UserProfile p, @RequestBody UpdateProfileRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        if (req.getDisplayName() != null) p.setDisplayName(req.getDisplayName());
        if (req.getAvatarUrl()   != null) p.setAvatarUrl(req.getAvatarUrl());
        if (req.getPhone()        != null) p.setPhone(req.getPhone());
        if (req.getPosition()     != null) p.setPosition(req.getPosition());
        if (req.getDepartment()   != null) p.setDepartment(req.getDepartment());
        return ResponseEntity.ok(ApiResponse.ok(userProfileRepository.save(p)));
    }

    /**
     * Salva ou atualiza o Expo Push Token do usuário autenticado.
     * O app deve chamar este endpoint após obter o token via expo-notifications.
     */
    @PostMapping("/push-token")
    public ResponseEntity<ApiResponse<Void>> savePushToken(
            @AuthenticationPrincipal UserProfile p,
            @RequestBody Map<String, String> body) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        String token = body.get("push_token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("push_token é obrigatório"));
        }
        p.setPushToken(token);
        userProfileRepository.save(p);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
