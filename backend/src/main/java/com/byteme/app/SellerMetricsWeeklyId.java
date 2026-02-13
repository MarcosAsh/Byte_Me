package com.byteme.app;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class SellerMetricsWeeklyId implements Serializable {

    private UUID sellerId;
    private LocalDate weekStart;

    public SellerMetricsWeeklyId() {}

    public SellerMetricsWeeklyId(UUID sellerId, LocalDate weekStart) {
        this.sellerId = sellerId;
        this.weekStart = weekStart;
    }

    public UUID getSellerId() { return sellerId; }
    public LocalDate getWeekStart() { return weekStart; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SellerMetricsWeeklyId that = (SellerMetricsWeeklyId) o;
        return Objects.equals(sellerId, that.sellerId) && Objects.equals(weekStart, that.weekStart);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sellerId, weekStart);
    }
}
