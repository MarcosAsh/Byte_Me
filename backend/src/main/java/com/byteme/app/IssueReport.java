package com.byteme.app;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

// Issue report entity
@Entity
@Table(name = "issue_report")
public class IssueReport {

    // Issue types
    public enum Type { UNAVAILABLE, QUALITY, OTHER }
    // Issue status types
    public enum Status { OPEN, RESPONDED, RESOLVED }

    // Primary key
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID issueId;

    // Link to reservation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    // Link to organisation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    private Organisation organisation;

    // Issue type
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    // Issue description
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    // Current status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    // Seller response text
    @Column(columnDefinition = "TEXT")
    private String sellerResponse;

    // Creation time
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Resolution time
    private Instant resolvedAt;

    // Getters
    public UUID getIssueId() { return issueId; }
    public Reservation getReservation() { return reservation; }
    public Organisation getOrganisation() { return organisation; }
    public Type getType() { return type; }
    public String getDescription() { return description; }
    public Status getStatus() { return status; }
    public String getSellerResponse() { return sellerResponse; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getResolvedAt() { return resolvedAt; }

    // Setters
    public void setIssueId(UUID issueId) { this.issueId = issueId; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }
    public void setOrganisation(Organisation organisation) { this.organisation = organisation; }
    public void setType(Type type) { this.type = type; }
    public void setDescription(String description) { this.description = description; }
    public void setStatus(Status status) { this.status = status; }
    public void setSellerResponse(String sellerResponse) { this.sellerResponse = sellerResponse; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
