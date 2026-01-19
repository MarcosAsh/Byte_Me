package com.byteme.app;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "category")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID categoryId;

    @Column(nullable = false, unique = true)
    private String name;

    public Category() {}

    public UUID getCategoryId() {return categoryId;}
    public void setCategoryId(UUID categoryId) {this.categoryId = categoryId;}
    public String getName() {return name;}
    public void setName(String name) {this.name = name;}
}
