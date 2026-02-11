package com.byteme.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Full end-to-end integration test
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class FullFlowIntegrationTest {

    @Autowired private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    // Shared state across test steps
    private String sellerToken;
    private String sellerProfileId;
    private String orgToken;
    private String orgProfileId;
    private String bundleId;
    private String reservationId;
    private String claimCode;
    private String issueId;

    @BeforeEach
    void runFullFlow() throws Exception {
        // Step 1 Register seller 
        String sellerRegister = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("email", "seller@byteme-test.com");
            put("password", "password123");
            put("role", "SELLER");
            put("businessName", "Test Bakery");
            put("location", "123 Test St");
        }});

        MvcResult sellerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sellerRegister))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("SELLER"))
                .andExpect(jsonPath("$.profileId").isNotEmpty())
                .andReturn();

        JsonNode sellerJson = mapper.readTree(sellerResult.getResponse().getContentAsString());
        sellerToken = sellerJson.get("token").asText();
        sellerProfileId = sellerJson.get("profileId").asText();

        // Step 2 Register organisation 
        String orgRegister = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("email", "org@byteme-test.com");
            put("password", "password123");
            put("role", "ORG_ADMIN");
            put("businessName", "Test Charity");
            put("location", "456 Help Ave");
        }});

        MvcResult orgResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orgRegister))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ORG_ADMIN"))
                .andExpect(jsonPath("$.profileId").isNotEmpty())
                .andReturn();

        JsonNode orgJson = mapper.readTree(orgResult.getResponse().getContentAsString());
        orgToken = orgJson.get("token").asText();
        orgProfileId = orgJson.get("profileId").asText();

        // Step 3 Seller creates a bundle
        String pickupStart = Instant.now().plusSeconds(3600).toString();
        String pickupEnd = Instant.now().plusSeconds(7200).toString();

        String bundleJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("title", "Surplus Bread Bundle");
            put("description", "5 loaves of fresh bread");
            put("priceCents", 500);
            put("quantityTotal", 3);
            put("discountPct", 20);
            put("pickupStartAt", pickupStart);
            put("pickupEndAt", pickupEnd);
            put("allergensText", "Gluten, Wheat");
        }});

        MvcResult bundleResult = mockMvc.perform(post("/api/bundles")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bundleJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Surplus Bread Bundle"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();

        JsonNode bundleNode = mapper.readTree(bundleResult.getResponse().getContentAsString());
        bundleId = bundleNode.get("postingId").asText();

        // Step 4 Seller activates the bundle
        mockMvc.perform(post("/api/bundles/" + bundleId + "/activate")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Step 5 Org reserves the bundle
        String orderJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("postingId", bundleId);
            put("orgId", orgProfileId);
        }});

        MvcResult orderResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").isNotEmpty())
                .andExpect(jsonPath("$.quantity").value(1))
                .andExpect(jsonPath("$.claimCode").isNotEmpty())
                .andReturn();

        JsonNode orderNode = mapper.readTree(orderResult.getResponse().getContentAsString());
        reservationId = orderNode.get("reservationId").asText();
        claimCode = orderNode.get("claimCode").asText();

        // Step 6 Collect the reservation
        String collectJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("claimCode", claimCode);
        }});

        mockMvc.perform(post("/api/orders/" + reservationId + "/collect")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(collectJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // === Step 7: Org files an issue ===
        String issueJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("reservationId", reservationId);
            put("orgId", orgProfileId);
            put("type", "QUALITY");
            put("description", "Bread was stale");
        }});

        MvcResult issueResult = mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(issueJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andReturn();

        JsonNode issueNode = mapper.readTree(issueResult.getResponse().getContentAsString());
        issueId = issueNode.get("issueId").asText();
    }

    // Verification tests that run after the full flow 

    @Test
    @Order(1)
    void sellerCanLogin() throws Exception {
        String loginJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("email", "seller@byteme-test.com");
            put("password", "password123");
            put("role", "SELLER");
        }});

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("SELLER"));
    }

    @Test
    @Order(2)
    void orgCanLogin() throws Exception {
        String loginJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("email", "org@byteme-test.com");
            put("password", "password123");
            put("role", "ORG_ADMIN");
        }});

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ORG_ADMIN"));
    }

    @Test
    @Order(3)
    void meEndpointReturnsSeller() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("seller@byteme-test.com"))
                .andExpect(jsonPath("$.role").value("SELLER"));
    }

    @Test
    @Order(4)
    void bundleIsVisibleInPublicList() throws Exception {
        mockMvc.perform(get("/api/bundles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(5)
    void bundleGetByIdWorks() throws Exception {
        mockMvc.perform(get("/api/bundles/" + bundleId)
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Surplus Bread Bundle"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.quantityReserved").value(1));
    }

    @Test
    @Order(6)
    void sellerCanViewOrders() throws Exception {
        mockMvc.perform(get("/api/orders/seller/" + sellerProfileId)
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("COLLECTED"));
    }

    @Test
    @Order(7)
    void orgCanViewOrders() throws Exception {
        mockMvc.perform(get("/api/orders/org/" + orgProfileId)
                        .header("Authorization", "Bearer " + orgToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @Order(8)
    void analyticsDashboardShowsData() throws Exception {
        mockMvc.perform(get("/api/analytics/dashboard/" + sellerProfileId)
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerName").value("Test Bakery"))
                .andExpect(jsonPath("$.totalBundlesPosted").value(1))
                .andExpect(jsonPath("$.collectedCount").value(1));
    }

    @Test
    @Order(9)
    void sellThroughEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/analytics/sell-through/" + sellerProfileId)
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.collected").value(1));
    }

    @Test
    @Order(10)
    void gamificationStreakUpdated() throws Exception {
        mockMvc.perform(get("/api/gamification/streak/" + orgProfileId)
                        .header("Authorization", "Bearer " + orgToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreakWeeks").value(greaterThanOrEqualTo(1)));
    }

    @Test
    @Order(11)
    void gamificationStatsWork() throws Exception {
        mockMvc.perform(get("/api/gamification/stats/" + orgProfileId)
                        .header("Authorization", "Bearer " + orgToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReservations").value(1));
    }

    @Test
    @Order(12)
    void badgesEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/gamification/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(13)
    void issueVisibleToSeller() throws Exception {
        mockMvc.perform(get("/api/issues/seller/" + sellerProfileId)
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("OPEN"));
    }

    @Test
    @Order(14)
    void sellerRespondsAndResolvesIssue() throws Exception {
        String respondJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("response", "Sorry about that, we will improve quality control");
            put("resolve", true);
        }});

        mockMvc.perform(post("/api/issues/" + issueId + "/respond")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(respondJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.sellerResponse").isNotEmpty());
    }

    @Test
    @Order(15)
    void duplicateEmailRegistrationFails() throws Exception {
        String dupRegister = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("email", "seller@byteme-test.com");
            put("password", "password123");
            put("role", "SELLER");
            put("businessName", "Duplicate");
        }});

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dupRegister))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(16)
    void wrongPasswordLoginFails() throws Exception {
        String loginJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("email", "seller@byteme-test.com");
            put("password", "wrongpassword");
        }});

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(17)
    void categoriesEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(18)
    void sellerCanCloseBundle() throws Exception {
        mockMvc.perform(post("/api/bundles/" + bundleId + "/close")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    @Order(19)
    void cannotReserveClosedBundle() throws Exception {
        // Close the bundle first
        mockMvc.perform(post("/api/bundles/" + bundleId + "/close")
                .header("Authorization", "Bearer " + sellerToken));

        String orderJson = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("postingId", bundleId);
            put("orgId", orgProfileId);
        }});

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))
                .andExpect(status().isBadRequest());
    }
}
