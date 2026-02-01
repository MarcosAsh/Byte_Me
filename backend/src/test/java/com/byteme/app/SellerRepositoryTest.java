package com.byteme.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class SellerRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private SellerRepository sellerRepo;

    private UserAccount sharedUser;

    @BeforeEach
    void setUp() {
        // Create parent user account
        sharedUser = new UserAccount();
        sharedUser.setEmail("vendor-" + UUID.randomUUID() + "@byteme.com");
        sharedUser.setPasswordHash("secure_hash");
        sharedUser.setRole(UserAccount.Role.SELLER);
        entityManager.persist(sharedUser);
        entityManager.flush();
    }

    @Test
    void testSaveAndFindSeller() {
        // Arrange
        Seller seller = new Seller();
        seller.setName("The Sustainable Baker");
        seller.setUser(sharedUser);
        seller.setLocationText("Exeter High St");

        // Act
        Seller saved = sellerRepo.save(seller);
        entityManager.flush();
        entityManager.clear();

        Optional<Seller> found = sellerRepo.findById(saved.getSellerId());

        // Assert
        assertTrue(found.isPresent());
        assertEquals("The Sustainable Baker", found.get().getName());
        
        // Use truncatedTo(ChronoUnit.MILLIS) to prevent nanosecond mismatch
        assertEquals(
            saved.getCreatedAt().truncatedTo(ChronoUnit.MILLIS), 
            found.get().getCreatedAt().truncatedTo(ChronoUnit.MILLIS)
        );
    }

    @Test
    void testCreatedAtIsImmutable() {
        // 1. Arrange: Persist a seller
        Seller seller = new Seller();
        seller.setName("Immutability Test");
        seller.setUser(sharedUser);
        Seller firstSave = entityManager.persistAndFlush(seller);
        
        Instant originalTimestamp = firstSave.getCreatedAt();

        // 2. Act: Attempt to modify the timestamp and save
        // We simulate a significant change (1 hour later)
        firstSave.setCreatedAt(originalTimestamp.plus(1, ChronoUnit.HOURS));
        sellerRepo.save(firstSave);
        entityManager.flush();
        entityManager.clear(); // Ensure we pull fresh from DB

        // 3. Assert: Verify the DB did NOT update the timestamp
        Seller retrieved = entityManager.find(Seller.class, firstSave.getSellerId());
        
        assertEquals(
            originalTimestamp.truncatedTo(ChronoUnit.MILLIS), 
            retrieved.getCreatedAt().truncatedTo(ChronoUnit.MILLIS),
            "The createdAt timestamp should not have changed because updatable=false"
        );
    }

    @Test
    void testUpdateSellerDetails() {
        // Arrange
        Seller seller = new Seller();
        seller.setName("Old Shop Name");
        seller.setUser(sharedUser);
        seller = entityManager.persistAndFlush(seller);

        // Act
        seller.setName("New Shop Name");
        sellerRepo.save(seller);
        entityManager.flush();

        // Assert
        Seller updated = entityManager.find(Seller.class, seller.getSellerId());
        assertEquals("New Shop Name", updated.getName());
    }
}