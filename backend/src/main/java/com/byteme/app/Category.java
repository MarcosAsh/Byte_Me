package com.byteme.app;

import jakarta.persistence.*;
import java.util.UUID;

// Food category entity
@Entity
@Table(name = "category")
public class Category {

    // Primary key
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID categoryId;

    // Category name
    @Column(nullable = false, unique = true)
    private String name;

    public Category() {}

    // Getters
    public UUID getCategoryId() { return categoryId; }
    public String getName() { return name; }

    // Setters
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public void setName(String name) { this.name = name; }
}
