package com.byteme.app;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "seller_metrics_weekly")
@IdClass(SellerMetricsWeeklyId.class)
public class SellerMetricsWeekly {

    @Id
    @Column(name = "seller_id")
    private UUID sellerId;

    @Id
    private LocalDate weekStart;

    @Column(nullable = false)
    private int postedCount;

    @Column(nullable = false)
    private int reservedCount;

    @Column(nullable = false)
    private int collectedCount;

    @Column(nullable = false)
    private int noShowCount;

    @Column(nullable = false)
    private int expiredCount;

    @Column(nullable = false)
    private double sellThroughRate;

    @Column(nullable = false)
    private int wasteAvoidedGrams;

    public UUID getSellerId() { return sellerId; }
    public LocalDate getWeekStart() { return weekStart; }
    public int getPostedCount() { return postedCount; }
    public int getReservedCount() { return reservedCount; }
    public int getCollectedCount() { return collectedCount; }
    public int getNoShowCount() { return noShowCount; }
    public int getExpiredCount() { return expiredCount; }
    public double getSellThroughRate() { return sellThroughRate; }
    public int getWasteAvoidedGrams() { return wasteAvoidedGrams; }

    public void setSellerId(UUID sellerId) { this.sellerId = sellerId; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }
    public void setPostedCount(int postedCount) { this.postedCount = postedCount; }
    public void setReservedCount(int reservedCount) { this.reservedCount = reservedCount; }
    public void setCollectedCount(int collectedCount) { this.collectedCount = collectedCount; }
    public void setNoShowCount(int noShowCount) { this.noShowCount = noShowCount; }
    public void setExpiredCount(int expiredCount) { this.expiredCount = expiredCount; }
    public void setSellThroughRate(double sellThroughRate) { this.sellThroughRate = sellThroughRate; }
    public void setWasteAvoidedGrams(int wasteAvoidedGrams) { this.wasteAvoidedGrams = wasteAvoidedGrams; }
}
