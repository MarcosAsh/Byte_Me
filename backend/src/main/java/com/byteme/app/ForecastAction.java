package com.byteme.app;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "forecast_action")
public class ForecastAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID actionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "posting_id")
    private BundlePosting posting;

    @Column(nullable = false, length = 50)
    private String actionType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getActionId() { return actionId; }
    public Seller getSeller() { return seller; }
    public BundlePosting getPosting() { return posting; }
    public String getActionType() { return actionType; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }

    public void setActionId(UUID actionId) { this.actionId = actionId; }
    public void setSeller(Seller seller) { this.seller = seller; }
    public void setPosting(BundlePosting posting) { this.posting = posting; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
