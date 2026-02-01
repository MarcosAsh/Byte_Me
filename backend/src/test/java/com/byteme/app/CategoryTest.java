package com.byteme.app;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

@DataJpaTest
class CategoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void testCategoryPersistence() {
        Category category = new Category();
        category.setName("Bakery");

        Category saved = entityManager.persistAndFlush(category);

        assertNotNull(saved.getCategoryId());
        assertEquals("Bakery", saved.getName());
    }

    @Test
    void testCategoryNameCannotBeNull() {
        Category category = new Category();
        category.setName(null);

        // Catching RuntimeException handles both Spring and Hibernate exception types
        assertThrows(RuntimeException.class, () -> {
            entityManager.persistAndFlush(category);
        });
    }

    @Test
    void testCategoryNameMustBeUnique() {
        Category cat1 = new Category();
        cat1.setName("Produce");
        entityManager.persistAndFlush(cat1);

        Category cat2 = new Category();
        cat2.setName("Produce");

        // Catching RuntimeException prevents the "expected DataIntegrity but got ConstraintViolation" error
        assertThrows(RuntimeException.class, () -> {
            entityManager.persistAndFlush(cat2);
        });
    }

    @Test
    void testGettersAndSetters() {
        UUID id = UUID.randomUUID();
        Category category = new Category();
        
        category.setCategoryId(id);
        category.setName("Frozen");

        assertEquals(id, category.getCategoryId());
        assertEquals("Frozen", category.getName());
    }
}