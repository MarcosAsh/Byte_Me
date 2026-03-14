package com.byteme.app;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rescue_event")
public class RescueEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organisation organisation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Reservation reservation;

    @Column(nullable = false)
    private Instant collectedAt = Instant.now();

    @Column(nullable = false)
    private int mealsEstimate;

    @Column(nullable = false)
    private int co2eEstimateGrams;

    public UUID getEventId() { return eventId; }
    public Organisation getOrganisation() { return organisation; }
    public Reservation getReservation() { return reservation; }
    public Instant getCollectedAt() { return collectedAt; }
    public int getMealsEstimate() { return mealsEstimate; }
    public int getCo2eEstimateGrams() { return co2eEstimateGrams; }
}
