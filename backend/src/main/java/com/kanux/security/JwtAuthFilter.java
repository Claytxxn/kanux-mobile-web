package com.kanux.security;

import com.kanux.repository.UserProfileRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwtService;
    private final UserProfileRepository userProfileRepository;

    public JwtAuthFilter(JwtService jwtService, UserProfileRepository userProfileRepository) {
        this.jwtService = jwtService;
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = authHeader.substring(7);
        try {
            if (jwtService.isValid(token)) {
                UUID authUserId = jwtService.extractUserId(token);
                userProfileRepository.findByAuthUserId(authUserId).ifPresent(profile -> {
                    var auth = new UsernamePasswordAuthenticationToken(
                            profile, null,
                            profile.isSuperAdmin()
                                    ? List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"))
                                    : List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        } catch (Exception e) {
            log.debug("Erro ao autenticar JWT: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }
}
