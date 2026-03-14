package com.byteme.app;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

class GamificationControllerTest {

    private MockMvc mockMvc;
    private UUID mockUserId;

    @Mock private OrganisationRepository orgRepo;
    @Mock private OrganisationStreakCacheRepository streakRepo;
    @Mock private ReservationRepository reservationRepo;
    @Mock private BadgeRepository badgeRepo;
    @Mock private OrganisationBadgeRepository orgBadgeRepo;
    @Mock private RescueEventRepository rescueEventRepo;

    @InjectMocks
    private GamificationController gamificationController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        mockMvc = MockMvcBuilders.standaloneSetup(gamificationController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        mockUserId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(mockUserId, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testGetStreak_Success() throws Exception {
        UUID orgId = UUID.randomUUID();
        UserAccount user = new UserAccount();
        user.setUserId(mockUserId);
        Organisation org = new Organisation();
        org.setUser(user);

        OrganisationStreakCache streak = new OrganisationStreakCache();
        streak.setCurrentStreakWeeks(5);
        streak.setBestStreakWeeks(10);
        streak.setLastRescueWeekStart(LocalDate.of(2023, 10, 1));

        when(orgRepo.findById(orgId)).thenReturn(Optional.of(org));
        when(streakRepo.findById(orgId)).thenReturn(Optional.of(streak));

        mockMvc.perform(get("/api/gamification/streak/{orgId}", orgId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreakWeeks").value(5))
                .andExpect(jsonPath("$.bestStreakWeeks").value(10))
                .andExpect(jsonPath("$.lastRescueWeekStart").value("2023-10-01"));
    }

    @Test
    void testGetStats_Success() throws Exception {
        UUID orgId = UUID.randomUUID();
        UserAccount user = new UserAccount();
        user.setUserId(mockUserId);
        Organisation org = new Organisation();
        org.setUser(user);

        OrganisationStreakCache streak = new OrganisationStreakCache();
        streak.setCurrentStreakWeeks(3);
        streak.setBestStreakWeeks(8);

        when(orgRepo.findById(orgId)).thenReturn(Optional.of(org));
        when(streakRepo.findById(orgId)).thenReturn(Optional.of(streak));
        when(reservationRepo.findByOrganisationOrgId(orgId)).thenReturn(
                Collections.nCopies(50, new Reservation())
        );

        OrganisationBadge badge = new OrganisationBadge();
        when(orgBadgeRepo.findByOrgId(orgId)).thenReturn(Collections.singletonList(badge));

        mockMvc.perform(get("/api/gamification/stats/{orgId}", orgId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReservations").value(50))
                .andExpect(jsonPath("$.currentStreakWeeks").value(3))
                .andExpect(jsonPath("$.badgesEarned").value(1));
    }

    @Test
    void testGetStreak_NotFound() throws Exception {
        UUID orgId = UUID.randomUUID();
        when(orgRepo.findById(orgId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/gamification/streak/{orgId}", orgId))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetAllBadges_Empty() throws Exception {
        when(badgeRepo.findAll()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/gamification/badges"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void testDTOFullCoverage() {
        LocalDate date = LocalDate.of(2026, 2, 1);

        GamificationController.StreakResponse streak = new GamificationController.StreakResponse(2, 5, date);

        assertEquals(2, streak.getCurrentStreakWeeks());
        assertEquals(5, streak.getBestStreakWeeks());
        assertEquals(date, streak.getLastRescueWeekStart());

        GamificationController.StatsResponse stats = new GamificationController.StatsResponse(100, 10, 20, 15, 42L, 8400L);

        assertEquals(100, stats.getTotalReservations());
        assertEquals(10, stats.getCurrentStreakWeeks());
        assertEquals(20, stats.getBestStreakWeeks());
        assertEquals(15, stats.getBadgesEarned());
        assertEquals(42L, stats.getMealsRescued());
        assertEquals(8400L, stats.getCo2eSavedGrams());
    }
}
