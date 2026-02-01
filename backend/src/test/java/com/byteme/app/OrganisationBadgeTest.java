package com.byteme.app;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OrganisationBadgeTest {

    @Test
    void testEntityStateAndGetters() {
        // Arrange
        OrganisationBadge orgBadge = new OrganisationBadge();
        UUID orgId = UUID.randomUUID();
        UUID badgeId = UUID.randomUUID();
        Instant now = Instant.now();

        // Act
        orgBadge.setOrgId(orgId);
        orgBadge.setBadgeId(badgeId);
        orgBadge.setAwardedAt(now);

        // Assert
        assertEquals(orgId, orgBadge.getOrgId());
        assertEquals(badgeId, orgBadge.getBadgeId());
        assertEquals(now, orgBadge.getAwardedAt());
    }

    @Test
    void testKeyClassLogic() {
        // Arrange
        OrganisationBadge.Key key = new OrganisationBadge.Key();
        UUID orgId = UUID.randomUUID();
        UUID badgeId = UUID.randomUUID();

        // Act
        key.setOrgId(orgId);
        key.setBadgeId(badgeId);

        // Assert
        assertEquals(orgId, key.getOrgId());
        assertEquals(badgeId, key.getBadgeId());
    }

    @Test
    void testDefaultValues() {
        // Act
        OrganisationBadge orgBadge = new OrganisationBadge();

        // Assert
        assertNotNull(orgBadge.getAwardedAt(), "awardedAt should be initialized by default");
        // Verify it's initialized to 'now' (within a reasonable margin)
        assertTrue(orgBadge.getAwardedAt().isBefore(Instant.now().plusSeconds(1)));
    }

    @Test
    void testRelationships() {
        // Arrange
        OrganisationBadge orgBadge = new OrganisationBadge();
        Organisation org = new Organisation();
        Badge badge = new Badge();

        // Act
        orgBadge.setOrganisation(org);
        orgBadge.setBadge(badge);

        // Assert
        assertEquals(org, orgBadge.getOrganisation());
        assertEquals(badge, orgBadge.getBadge());
    }
}