package com.byteme.app;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

// Reservation entity
@Entity
@Table(name = "reservation")
public class Reservation {

    // Reservation status types
    public enum Status { RESERVED, COLLECTED, NO_SHOW, EXPIRED, CANCELLED }

    // Primary key
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID reservationId;

    // Link to bundle posting
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posting_id", nullable = false)
    private BundlePosting posting;

    // Link to organisation
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organisation organisation;

    // User who reserved
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserved_by_user_id")
    private UserAccount reservedByUser;

    // Time of reservation
    @Column(nullable = false)
    private Instant reservedAt = Instant.now();

    // Current status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.RESERVED;

    // Hashed claim code
    @Column(nullable = false)
    private String claimCodeHash;

    // Last four of claim code
    private String claimCodeLast4;

    // Collection timestamp
    private Instant collectedAt;
    // No show timestamp
    private Instant noShowMarkedAt;
    // Expired timestamp
    private Instant expiredMarkedAt;
    // Cancelled timestamp
    private Instant cancelledAt;

    // Getters
    public UUID getReservationId() { return reservationId; }
    public BundlePosting getPosting() { return posting; }
    public Organisation getOrganisation() { return organisation; }
    public UserAccount getReservedByUser() { return reservedByUser; }
    public Instant getReservedAt() { return reservedAt; }
    public Status getStatus() { return status; }
    public String getClaimCodeHash() { return claimCodeHash; }
    public String getClaimCodeLast4() { return claimCodeLast4; }
    public Instant getCollectedAt() { return collectedAt; }
    public Instant getNoShowMarkedAt() { return noShowMarkedAt; }
    public Instant getExpiredMarkedAt() { return expiredMarkedAt; }
    public Instant getCancelledAt() { return cancelledAt; }

    // Setters
    public void setReservationId(UUID reservationId) { this.reservationId = reservationId; }
    public void setPosting(BundlePosting posting) { this.posting = posting; }
    public void setOrganisation(Organisation organisation) { this.organisation = organisation; }
    public void setReservedByUser(UserAccount reservedByUser) { this.reservedByUser = reservedByUser; }
    public void setReservedAt(Instant reservedAt) { this.reservedAt = reservedAt; }
    public void setStatus(Status status) { this.status = status; }
    public void setClaimCodeHash(String claimCodeHash) { this.claimCodeHash = claimCodeHash; }
    public void setClaimCodeLast4(String claimCodeLast4) { this.claimCodeLast4 = claimCodeLast4; }
    public void setCollectedAt(Instant collectedAt) { this.collectedAt = collectedAt; }
    public void setNoShowMarkedAt(Instant noShowMarkedAt) { this.noShowMarkedAt = noShowMarkedAt; }
    public void setExpiredMarkedAt(Instant expiredMarkedAt) { this.expiredMarkedAt = expiredMarkedAt; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }
}
