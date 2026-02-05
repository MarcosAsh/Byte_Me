package com.byteme.app;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

// Organisation entity
@Entity
@Table(name = "organisation")
public class Organisation {

    // Primary key
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID orgId;

    // Link to user account
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserAccount user;

    // Organisation name
    @Column(nullable = false)
    private String name;

    // Location info
    private String locationText;
    // Billing email
    private String billingEmail;

    // Creation time
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Getters
    public UUID getOrgId() { return orgId; }
    public UserAccount getUser() { return user; }
    public String getName() { return name; }
    public String getLocationText() { return locationText; }
    public String getBillingEmail() { return billingEmail; }
    public Instant getCreatedAt() { return createdAt; }

    // Setters
    public void setOrgId(UUID orgId) { this.orgId = orgId; }
    public void setUser(UserAccount user) { this.user = user; }
    public void setName(String name) { this.name = name; }
    public void setLocationText(String locationText) { this.locationText = locationText; }
    public void setBillingEmail(String billingEmail) { this.billingEmail = billingEmail; }
}
