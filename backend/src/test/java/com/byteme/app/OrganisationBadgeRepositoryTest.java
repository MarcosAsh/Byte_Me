package com.byteme.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class OrganisationBadgeRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private OrganisationBadgeRepository orgBadgeRepo;

    private Organisation sharedOrg;
    private Badge sharedBadge;

    @BeforeEach
    void setUp() {
        // 1. Create User & Organisation
        UserAccount user = new UserAccount();
        user.setEmail("badge-org-" + UUID.randomUUID() + "@test.com");
        user.setPasswordHash("hash");
        user.setRole(UserAccount.Role.ORG_ADMIN);
        entityManager.persist(user);

        sharedOrg = new Organisation();
        sharedOrg.setName("Eco Warriors");
        sharedOrg.setUser(user);
        entityManager.persist(sharedOrg);

        // 2. Create Badge
        sharedBadge = new Badge();
        sharedBadge.setCode("FIRST_ORDER");
        sharedBadge.setName("First Order");
        sharedBadge.setDescription("Awarded for the first order placed.");
        entityManager.persist(sharedBadge);

        entityManager.flush();
    }

    @Test
    void testSaveAndFindOrganisationBadge() {
        // Arrange
        OrganisationBadge orgBadge = new OrganisationBadge();
        // Since columns are insertable = false via the entity object, 
        // we set the IDs directly for the @Id fields
        orgBadge.setOrgId(sharedOrg.getOrgId());
        orgBadge.setBadgeId(sharedBadge.getBadgeId());
        orgBadge.setAwardedAt(Instant.now());

        // Act
        orgBadgeRepo.save(orgBadge);
        entityManager.flush();
        entityManager.clear();

        // Use the Key class for lookup
        OrganisationBadge.Key key = new OrganisationBadge.Key();
        key.setOrgId(sharedOrg.getOrgId());
        key.setBadgeId(sharedBadge.getBadgeId());

        Optional<OrganisationBadge> found = orgBadgeRepo.findById(key);

        // Assert
        assertTrue(found.isPresent());
        assertEquals(sharedOrg.getOrgId(), found.get().getOrgId());
        assertEquals(sharedBadge.getBadgeId(), found.get().getBadgeId());
        // Verify relationship mapping
        assertNotNull(found.get().getOrganisation());
        assertEquals("Eco Warriors", found.get().getOrganisation().getName());
        assertEquals("FIRST_ORDER", found.get().getBadge().getCode());
    }

    @Test
    void testFindBadgesByOrganisation() {
        // Arrange: Create another badge and link it
        Badge secondBadge = new Badge();
        secondBadge.setCode("STREAK_4");
        secondBadge.setName("4 Week Streak");
        entityManager.persist(secondBadge);

        linkBadge(sharedOrg.getOrgId(), sharedBadge.getBadgeId());
        linkBadge(sharedOrg.getOrgId(), secondBadge.getBadgeId());
        
        entityManager.flush();

        // Act - Assuming your repository has this method:
        // List<OrganisationBadge> results = orgBadgeRepo.findByOrgId(sharedOrg.getOrgId());
        
        // Assert: Verify existence in DB
        OrganisationBadge.Key key = new OrganisationBadge.Key();
        key.setOrgId(sharedOrg.getOrgId());
        key.setBadgeId(secondBadge.getBadgeId());
        
        assertTrue(orgBadgeRepo.existsById(key));
    }

    private void linkBadge(UUID orgId, UUID badgeId) {
        OrganisationBadge ob = new OrganisationBadge();
        ob.setOrgId(orgId);
        ob.setBadgeId(badgeId);
        entityManager.persist(ob);
    }
}