package com.byteme.app;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class BadgeRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BadgeRepository badgeRepository;

    @Test
    void testFindByCode_Success() {
        // Arrange: Create and persist a Badge entity
        Badge badge = new Badge();
        badge.setName("Early Bird");
        badge.setCode("EARLY_BIRD_2026");
        // Add any other required fields for your Badge entity here
        
        entityManager.persistAndFlush(badge);

        // Act: Call the repository method
        Optional<Badge> found = badgeRepository.findByCode("EARLY_BIRD_2026");

        // Assert: Verify the results
        assertTrue(found.isPresent());
        assertEquals("Early Bird", found.get().getName());
    }

    @Test
    void testFindByCode_NotFound() {
        // Act
        Optional<Badge> found = badgeRepository.findByCode("NON_EXISTENT");

        // Assert
        assertFalse(found.isPresent());
    }

    @Test
    void testSaveAndFindById() {
        // Arrange
        Badge badge = new Badge();
        badge.setName("Sustainability Hero");
        badge.setCode("HERO_001");

        // Act
        Badge savedBadge = badgeRepository.save(badge);
        Optional<Badge> retrieved = badgeRepository.findById(savedBadge.getBadgeId());

        // Assert
        assertTrue(retrieved.isPresent());
        assertEquals("HERO_001", retrieved.get().getCode());
    }
}