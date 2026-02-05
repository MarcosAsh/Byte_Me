package com.byteme.app;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

// Food bundle posting entity
@Entity
@Table(name = "bundle_posting")
public class BundlePosting {

    // Bundle status types
    public enum Status { DRAFT, ACTIVE, CLOSED, CANCELLED }

    // Primary key
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID postingId;

    // Owner seller
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    // Food category
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    // Pickup time window
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "window_id")
    private PickupWindow window;

    // Bundle title
    @Column(nullable = false)
    private String title;

    // Bundle description
    @Column(columnDefinition = "TEXT")
    private String description;

    // Allergen info
    private String allergensText;

    // Pickup start time
    @Column(nullable = false)
    private Instant pickupStartAt;

    // Pickup end time
    @Column(nullable = false)
    private Instant pickupEndAt;

    // Total quantity available
    @Column(nullable = false)
    private Integer quantityTotal = 1;

    // Quantity already reserved
    @Column(nullable = false)
    private Integer quantityReserved = 0;

    // Price in cents
    @Column(nullable = false)
    private Integer priceCents;

    // Discount percentage
    @Column(nullable = false)
    private Integer discountPct = 0;

    // Estimated weight
    private Integer estimatedWeightGrams;

    // Current status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.DRAFT;

    // Creation time
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Check if can reserve
    public boolean canReserve(int qty) {
        return status == Status.ACTIVE && (quantityReserved + qty) <= quantityTotal;
    }

    // Get available quantity
    public int getAvailable() {
        return quantityTotal - quantityReserved;
    }

    // Getters
    public UUID getPostingId() { return postingId; }
    public Seller getSeller() { return seller; }
    public Category getCategory() { return category; }
    public PickupWindow getWindow() { return window; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getAllergensText() { return allergensText; }
    public Instant getPickupStartAt() { return pickupStartAt; }
    public Instant getPickupEndAt() { return pickupEndAt; }
    public Integer getQuantityTotal() { return quantityTotal; }
    public Integer getQuantityReserved() { return quantityReserved; }
    public Integer getPriceCents() { return priceCents; }
    public Integer getDiscountPct() { return discountPct; }
    public Integer getEstimatedWeightGrams() { return estimatedWeightGrams; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }

    // Setters
    public void setPostingId(UUID postingId) { this.postingId = postingId; }
    public void setSeller(Seller seller) { this.seller = seller; }
    public void setCategory(Category category) { this.category = category; }
    public void setWindow(PickupWindow window) { this.window = window; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setAllergensText(String allergensText) { this.allergensText = allergensText; }
    public void setPickupStartAt(Instant pickupStartAt) { this.pickupStartAt = pickupStartAt; }
    public void setPickupEndAt(Instant pickupEndAt) { this.pickupEndAt = pickupEndAt; }
    public void setQuantityTotal(Integer quantityTotal) { this.quantityTotal = quantityTotal; }
    public void setQuantityReserved(Integer quantityReserved) { this.quantityReserved = quantityReserved; }
    public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }
    public void setDiscountPct(Integer discountPct) { this.discountPct = discountPct; }
    public void setEstimatedWeightGrams(Integer estimatedWeightGrams) { this.estimatedWeightGrams = estimatedWeightGrams; }
    public void setStatus(Status status) { this.status = status; }
}
