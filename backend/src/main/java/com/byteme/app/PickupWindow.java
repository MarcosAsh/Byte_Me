package com.byteme.app;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.UUID;

// Pickup time window entity
@Entity
@Table(name = "pickup_window")
public class PickupWindow {

    // Primary key
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID windowId;

    // Window label
    @Column(nullable = false, unique = true)
    private String label;

    // Window start time
    @Column(nullable = false)
    private LocalTime startTime;

    // Window end time
    @Column(nullable = false)
    private LocalTime endTime;

    // Getters
    public UUID getWindowId() { return windowId; }
    public String getLabel() { return label; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }

    // Setters
    public void setWindowId(UUID windowId) { this.windowId = windowId; }
    public void setLabel(String label) { this.label = label; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}
