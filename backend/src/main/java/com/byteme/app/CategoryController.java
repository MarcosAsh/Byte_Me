package com.byteme.app;

import org.springframework.web.bind.annotation.*;
import java.util.List;

// Category controller
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    // Repository dependency
    private final CategoryRepository categoryRepo;

    // Constructor injection
    public CategoryController(CategoryRepository categoryRepo) {
        this.categoryRepo = categoryRepo;
    }

    // Get all categories
    @GetMapping
    public List<Category> getAll() {
        return categoryRepo.findAll();
    }
}
