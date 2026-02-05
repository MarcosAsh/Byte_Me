package com.byteme.app;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

// JWT utility class
@Component
public class JwtUtil {

    // Secret key
    private final SecretKey key;
    // Token expiration time
    private final long expiration;

    // Constructor with config values
    public JwtUtil(@Value("${jwt.secret}") String secret,
                   @Value("${jwt.expiration}") long expiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    // Generate new token
    public String generateToken(UUID userId, String email, UserAccount.Role role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    // Parse token claims
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Check if token valid
    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    // Get user id from token
    public UUID getUserId(String token) {
        return UUID.fromString(parseToken(token).getSubject());
    }

    // Get role from token
    public UserAccount.Role getRole(String token) {
        return UserAccount.Role.valueOf(parseToken(token).get("role", String.class));
    }
}
