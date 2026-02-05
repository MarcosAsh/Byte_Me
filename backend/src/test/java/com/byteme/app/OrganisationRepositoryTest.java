package com.byteme.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class OrganisationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private OrganisationRepository organisationRepo;

    private UserAccount sharedUser;

    @BeforeEach
    void setUp() {
        sharedUser = new UserAccount();
        sharedUser.setEmail("admin@charity.org");
        sharedUser.setPasswordHash("hashed_password");
        sharedUser.setRole(UserAccount.Role.ORG_ADMIN);
        entityManager.persist(sharedUser);
        entityManager.flush();
    }

    @Test
    void testSaveAndRetrieveOrganisation() {
        Organisation org = new Organisation();
        org.setName("Global Food Share");
        org.setUser(sharedUser);
        org.setLocationText("123 Giving Way");
        org.setBillingEmail("finance@charity.org");

        Organisation savedOrg = organisationRepo.save(org);
        entityManager.flush();
        entityManager.clear();

        Optional<Organisation> retrieved = organisationRepo.findById(savedOrg.getOrgId());

        assertTrue(retrieved.isPresent());
        Organisation found = retrieved.get();
        assertEquals("Global Food Share", found.getName());
        assertEquals("123 Giving Way", found.getLocationText());
        assertEquals("finance@charity.org", found.getBillingEmail());
        assertEquals(sharedUser.getUserId(), found.getUser().getUserId());
    }

    @Test
    void testFindByUserEmail() {
        Organisation org = new Organisation();
        org.setName("Test Org");
        org.setUser(sharedUser);
        entityManager.persist(org);
        entityManager.flush();

        Organisation found = organisationRepo.findAll().stream()
                .filter(o -> o.getUser().getEmail().equals("admin@charity.org"))
                .findFirst()
                .orElse(null);

        assertNotNull(found);
        assertEquals("Test Org", found.getName());
    }

    @Test
    void testDefaultValues() {
        Organisation org = new Organisation();
        org.setName("New Org");
        org.setUser(sharedUser);

        Organisation saved = organisationRepo.save(org);
        entityManager.flush();

        assertNotNull(saved.getCreatedAt());
    }
}
