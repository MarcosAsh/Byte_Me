package com.byteme.app;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class CategoryRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void testCreateAndFindCategory() {
        // Test Create
        Category category = new Category();
        category.setName("Fresh Produce");
        Category saved = categoryRepository.save(category);

        // Test Find
        Optional<Category> found = categoryRepository.findById(saved.getCategoryId());
        assertTrue(found.isPresent());
        assertEquals("Fresh Produce", found.get().getName());
    }

    @Test
    void testFindAll() {
        Category c1 = new Category();
        c1.setName("Dairy");
        entityManager.persist(c1);

        Category c2 = new Category();
        c2.setName("Bakery");
        entityManager.persist(c2);
        entityManager.flush();

        List<Category> all = categoryRepository.findAll();
        assertTrue(all.size() >= 2);
    }

    @Test
    void testUpdate() {
        Category category = new Category();
        category.setName("Old Name");
        Category saved = entityManager.persistAndFlush(category);

        saved.setName("New Name");
        categoryRepository.save(saved);
        
        Category updated = entityManager.find(Category.class, saved.getCategoryId());
        assertEquals("New Name", updated.getName());
    }

    @Test
    void testDelete() {
        Category category = new Category();
        category.setName("To be deleted");
        Category saved = entityManager.persistAndFlush(category);

        categoryRepository.deleteById(saved.getCategoryId());
        Optional<Category> found = categoryRepository.findById(saved.getCategoryId());
        assertFalse(found.isPresent());
    }

    @Test
    void testUniqueNameConstraint() {
        Category c1 = new Category();
        c1.setName("UniqueItem");
        categoryRepository.saveAndFlush(c1);

        Category c2 = new Category();
        c2.setName("UniqueItem");

        // Use RuntimeException to catch both Hibernate and Spring constraint errors
        assertThrows(RuntimeException.class, () -> {
            categoryRepository.saveAndFlush(c2);
        });
    }

    @Test
    void testNotNullConstraint() {
        Category category = new Category();
        category.setName(null);

        assertThrows(RuntimeException.class, () -> {
            categoryRepository.saveAndFlush(category);
        });
    }
}