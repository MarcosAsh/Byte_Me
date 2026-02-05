package com.byteme.app;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;
import java.util.UUID;

// User account entity
@Entity
@Table(name = "user_account")
public class UserAccount {

    // User roles
    public enum Role { SELLER, ORG_ADMIN }

    // Primary key
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID userId;

    // User email
    @Column(nullable = false, unique = true)
    private String email;

    // Hashed password
    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    // User role type
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Account creation time
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Getters
    public UUID getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public Instant getCreatedAt() { return createdAt; }

    // Setters
    public void setUserId(UUID userId) { this.userId = userId; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setRole(Role role) { this.role = role; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
