package com.kanux.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.util.Base64;
import java.util.UUID;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @Value("${supabase.jwt-secret}")
    private String jwtSecret;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    private volatile Key resolvedKey;
    private volatile String resolvedAlgo;

    public UUID extractUserId(String token) {
        return UUID.fromString(getClaims(token).getSubject());
    }

    public boolean isValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            log.debug("JWT inválido: {}", e.getMessage());
            return false;
        }
    }

    public Claims getClaims(String token) {
        Key key = getOrResolveKey(token);
        JwtParserBuilder builder = Jwts.parser();
        if (key instanceof SecretKey sk) {
            builder.verifyWith(sk);
        } else if (key instanceof PublicKey pk) {
            builder.verifyWith(pk);
        } else {
            throw new JwtException("Unsupported key type: " + key.getClass().getName());
        }
        return builder.build().parseSignedClaims(token).getPayload();
    }

    public String getResolvedAlgo() {
        return resolvedAlgo;
    }

    // ── Key resolution ──────────────────────────────────────────────────

    private Key getOrResolveKey(String token) {
        if (resolvedKey != null) return resolvedKey;

        String algo = peekAlgorithm(token);
        log.info("JWT algorithm detected from token header: {}", algo);

        if (algo.startsWith("ES")) {
            return resolveES256Key();
        } else {
            return resolveHmacKey(token);
        }
    }

    /** Decode JWT header WITHOUT verification to read the 'alg' field. */
    private String peekAlgorithm(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return "HS256";
            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            JsonNode header = new ObjectMapper().readTree(headerJson);
            return header.has("alg") ? header.get("alg").asText() : "HS256";
        } catch (Exception e) {
            return "HS256";
        }
    }

    // ── ES256 (ECDSA P-256) via Supabase JWKS ──────────────────────────

    private Key resolveES256Key() {
        String baseUrl = supabaseUrl;
        if (baseUrl == null || baseUrl.isBlank()) {
            log.error("ES256 JWT detected but supabase.url is not configured!");
            throw new JwtException("supabase.url is required for ES256 JWT verification");
        }

        String jwksUrl = baseUrl.replaceAll("/$", "") + "/auth/v1/.well-known/jwks.json";
        log.info("Fetching JWKS from: {}", jwksUrl);

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(jwksUrl)).GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new JwtException("JWKS endpoint returned HTTP " + response.statusCode());
            }

            JsonNode jwks = new ObjectMapper().readTree(response.body());
            JsonNode keys = jwks.get("keys");
            if (keys == null || !keys.isArray() || keys.isEmpty()) {
                throw new JwtException("JWKS has no 'keys' array or it is empty");
            }

            for (JsonNode jwk : keys) {
                String kty = jwk.has("kty") ? jwk.get("kty").asText() : "";
                if (!"EC".equals(kty)) continue;

                // Prefer keys marked for signing; skip encryption keys
                String use = jwk.has("use") ? jwk.get("use").asText() : "sig";
                if (!"sig".equals(use)) continue;

                byte[] xBytes = Base64.getUrlDecoder().decode(jwk.get("x").asText());
                byte[] yBytes = Base64.getUrlDecoder().decode(jwk.get("y").asText());

                ECPoint point = new ECPoint(new BigInteger(1, xBytes), new BigInteger(1, yBytes));
                AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
                params.init(new ECGenParameterSpec("secp256r1")); // P-256 for ES256
                ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);

                KeyFactory kf = KeyFactory.getInstance("EC");
                PublicKey ecPubKey = kf.generatePublic(new ECPublicKeySpec(point, ecSpec));

                resolvedKey = ecPubKey;
                resolvedAlgo = "ES256";
                log.info("✅ JWT key resolved: ES256 public key from Supabase JWKS");
                return resolvedKey;
            }

            throw new JwtException("No EC signing key found in JWKS response");
        } catch (JwtException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch/parse JWKS from {}: {}", jwksUrl, e.getMessage());
            throw new JwtException("ES256 key resolution failed: " + e.getMessage());
        }
    }

    // ── HS256 (HMAC-SHA) ────────────────────────────────────────────────

    private Key resolveHmacKey(String token) {
        String secret = jwtSecret.trim();

        // Try 1: raw UTF-8
        SecretKey rawKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        try {
            Jwts.parser().verifyWith(rawKey).build().parseSignedClaims(token);
            resolvedKey = rawKey;
            resolvedAlgo = "HS256-raw";
            log.info("JWT key resolved: raw UTF-8 ({} chars)", secret.length());
            return resolvedKey;
        } catch (io.jsonwebtoken.security.SignatureException e) {
            // try base64
        } catch (JwtException | IllegalArgumentException e) {
            resolvedKey = rawKey;
            resolvedAlgo = "HS256-raw";
            return resolvedKey;
        }

        // Try 2: base64-decoded
        try {
            byte[] decoded = Base64.getDecoder().decode(secret);
            SecretKey b64Key = Keys.hmacShaKeyFor(decoded);
            Jwts.parser().verifyWith(b64Key).build().parseSignedClaims(token);
            resolvedKey = b64Key;
            resolvedAlgo = "HS256-b64";
            log.info("JWT key resolved: base64-decoded ({} bytes)", decoded.length);
            return resolvedKey;
        } catch (io.jsonwebtoken.security.SignatureException | IllegalArgumentException e2) {
            // both failed
        } catch (JwtException e2) {
            try {
                byte[] decoded = Base64.getDecoder().decode(secret);
                resolvedKey = Keys.hmacShaKeyFor(decoded);
                resolvedAlgo = "HS256-b64";
                return resolvedKey;
            } catch (IllegalArgumentException ignored) {}
        }

        log.warn("JWT HMAC key could not be resolved — falling back to raw UTF-8");
        resolvedKey = rawKey;
        resolvedAlgo = "HS256-fallback";
        return resolvedKey;
    }
}

