package com.byteme.app;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "demand_observation")
public class DemandObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID obsId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "window_id", nullable = false)
    private PickupWindow window;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int dayOfWeek;

    @Column(nullable = false)
    private int discountPct;

    @Column(nullable = false)
    private boolean weatherFlag;

    @Column(nullable = false)
    private int observedReservations;

    @Column(nullable = false)
    private double observedNoShowRate;

    public UUID getObsId() { return obsId; }
    public Seller getSeller() { return seller; }
    public Category getCategory() { return category; }
    public PickupWindow getWindow() { return window; }
    public LocalDate getDate() { return date; }
    public int getDayOfWeek() { return dayOfWeek; }
    public int getDiscountPct() { return discountPct; }
    public boolean isWeatherFlag() { return weatherFlag; }
    public int getObservedReservations() { return observedReservations; }
    public double getObservedNoShowRate() { return observedNoShowRate; }

    public void setObsId(UUID obsId) { this.obsId = obsId; }
    public void setSeller(Seller seller) { this.seller = seller; }
    public void setCategory(Category category) { this.category = category; }
    public void setWindow(PickupWindow window) { this.window = window; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public void setDiscountPct(int discountPct) { this.discountPct = discountPct; }
    public void setWeatherFlag(boolean weatherFlag) { this.weatherFlag = weatherFlag; }
    public void setObservedReservations(int observedReservations) { this.observedReservations = observedReservations; }
    public void setObservedNoShowRate(double observedNoShowRate) { this.observedNoShowRate = observedNoShowRate; }
}
