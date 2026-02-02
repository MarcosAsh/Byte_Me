package com.byteme.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AutomatedTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserAccountRepository userRepo;
    @Autowired private SellerRepository sellerRepo;
    @Autowired private EntityManager entityManager;

    private UUID sellerUserId;
    private UUID sellerId;

    @BeforeEach
    void setUp() {
        sellerRepo.deleteAll();
        userRepo.deleteAll();

        UserAccount acc = new UserAccount();
        acc.setEmail("tester-" + UUID.randomUUID() + "@byteme.com");
        acc.setPasswordHash("hash123");
        acc.setRole(UserAccount.Role.SELLER);
        acc = userRepo.saveAndFlush(acc); 
        this.sellerUserId = acc.getUserId();

        Seller s = new Seller();
        s.setUser(acc); 
        s.setName("ByteMe Bakery");
        s.setCreatedAt(Instant.now());
        s = sellerRepo.saveAndFlush(s);
        this.sellerId = s.getSellerId();

        entityManager.flush();
        entityManager.clear();
    }

    @Test void test_PostBundle_Success() throws Exception {
        String json = "{\"title\":\"Bread\",\"priceCents\":500,\"quantityTotal\":5,\"activate\":true}";
        var auth = new UsernamePasswordAuthenticationToken(sellerUserId, null, 
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_SELLER")));

        mockMvc.perform(post("/api/bundles")
                .with(authentication(auth))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk());
    }

    @Test void test_GetBundles_ListAvailable() throws Exception {
        mockMvc.perform(get("/api/bundles"))
                .andExpect(status().isOk());
    }

    @Test void test_MeEndpoint_Authorized() throws Exception {
        var auth = new UsernamePasswordAuthenticationToken(sellerUserId, null, 
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_SELLER")));
        
        mockMvc.perform(get("/api/auth/me")
                .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(sellerUserId.toString()));
    }

    @Test void test_AdminAccess_Denied() throws Exception {
        var auth = new UsernamePasswordAuthenticationToken(sellerUserId, null, 
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_SELLER")));
        
        mockMvc.perform(get("/api/admin/stats")
                .with(authentication(auth)))
                .andExpect(status().isNotFound());
    }

    @Test void test_Dashboard_Success() throws Exception {
        var auth = new UsernamePasswordAuthenticationToken(sellerUserId, null, 
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_SELLER")));
        
        mockMvc.perform(get("/api/analytics/dashboard/" + sellerId)
                .with(authentication(auth)))
                .andExpect(status().isOk());
    }
}