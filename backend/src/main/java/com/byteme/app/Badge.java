package com.byteme.app;

import jakarta.persistence.*;
import java.util.UUID;

// Badge entity
@Entity
@Table(name = "badge")
public class Badge {

    // Primary key
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID badgeId;

    // Unique badge code
    @Column(nullable = false, unique = true)
    private String code;

    // Badge name
    @Column(nullable = false)
    private String name;

    // Badge description
    @Column(columnDefinition = "TEXT")
    private String description;

    public Badge() {}

    // Getters
    public UUID getBadgeId() { return badgeId; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }

    // Setters
    public void setBadgeId(UUID badgeId) { this.badgeId = badgeId; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
}
