package com.byteme.app;

import org.junit.jupiter.api.Test;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OrganisationTest {

    @Test
    void testOrganisationStateAndGetters() {
        Organisation org = new Organisation();
        UserAccount user = new UserAccount();
        UUID orgId = UUID.randomUUID();

        org.setOrgId(orgId);
        org.setUser(user);
        org.setName("Exeter Food Bank");
        org.setLocationText("Exeter, UK");
        org.setBillingEmail("billing@exeterfood.org");

        assertEquals(orgId, org.getOrgId());
        assertEquals(user, org.getUser());
        assertEquals("Exeter Food Bank", org.getName());
        assertEquals("Exeter, UK", org.getLocationText());
        assertEquals("billing@exeterfood.org", org.getBillingEmail());
    }

    @Test
    void testDefaults() {
        Organisation org = new Organisation();

        assertNotNull(org.getCreatedAt(), "CreatedAt should be auto-initialized");
    }
}
