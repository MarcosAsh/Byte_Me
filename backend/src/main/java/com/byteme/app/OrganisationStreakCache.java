package com.byteme.app;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

// Organisation streak cache entity
@Entity
@Table(name = "organisation_streak_cache")
public class OrganisationStreakCache {

    // Organisation id as primary key
    @Id
    private UUID orgId;

    // Link to organisation
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "org_id")
    private Organisation organisation;

    // Current streak weeks
    @Column(nullable = false)
    private Integer currentStreakWeeks = 0;

    // Best streak weeks
    @Column(nullable = false)
    private Integer bestStreakWeeks = 0;

    // Last rescue week start
    private LocalDate lastRescueWeekStart;

    // Last update time
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    // Getters
    public UUID getOrgId() { return orgId; }
    public Organisation getOrganisation() { return organisation; }
    public Integer getCurrentStreakWeeks() { return currentStreakWeeks; }
    public Integer getBestStreakWeeks() { return bestStreakWeeks; }
    public LocalDate getLastRescueWeekStart() { return lastRescueWeekStart; }
    public Instant getUpdatedAt() { return updatedAt; }

    // Setters
    public void setOrgId(UUID orgId) { this.orgId = orgId; }
    public void setOrganisation(Organisation organisation) { this.organisation = organisation; }
    public void setCurrentStreakWeeks(Integer currentStreakWeeks) { this.currentStreakWeeks = currentStreakWeeks; }
    public void setBestStreakWeeks(Integer bestStreakWeeks) { this.bestStreakWeeks = bestStreakWeeks; }
    public void setLastRescueWeekStart(LocalDate lastRescueWeekStart) { this.lastRescueWeekStart = lastRescueWeekStart; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
