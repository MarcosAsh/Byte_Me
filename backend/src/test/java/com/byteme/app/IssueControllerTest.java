package com.byteme.app;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

class IssueControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private IssueReportRepository issueRepo;
    @Mock private ReservationRepository reservationRepo;
    @Mock private OrganisationRepository orgRepo;

    @InjectMocks
    private IssueController issueController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        ObjectMapper testMapper = new ObjectMapper();
        testMapper.registerModule(new JavaTimeModule());
        testMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        mockMvc = MockMvcBuilders.standaloneSetup(issueController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(testMapper))
                .build();
    }

    @Test
    void testGetBySeller() throws Exception {
        UUID sellerId = UUID.randomUUID();
        when(issueRepo.findBySeller(sellerId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/issues/seller/{sellerId}", sellerId))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void testGetOpenBySeller() throws Exception {
        UUID sellerId = UUID.randomUUID();
        when(issueRepo.findOpenBySeller(sellerId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/issues/seller/{sellerId}/open", sellerId))
                .andExpect(status().isOk());
    }

    @Test
    void testGetByOrg() throws Exception {
        UUID orgId = UUID.randomUUID();
        when(issueRepo.findByOrganisationOrgId(orgId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/issues/org/{orgId}", orgId))
                .andExpect(status().isOk());
    }

    @Test
    void testCreateIssue() throws Exception {
        IssueController.CreateIssueRequest req = new IssueController.CreateIssueRequest();
        req.setReservationId(UUID.randomUUID());
        req.setDescription("Missing items");

        if (IssueReport.Type.values().length > 0) {
            req.setType(IssueReport.Type.values()[0]);
        }

        when(reservationRepo.findById(any())).thenReturn(Optional.of(new Reservation()));
        when(issueRepo.save(any())).thenAnswer(i -> i.getArguments()[0]);

        mockMvc.perform(post("/api/issues")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Missing items"));
    }

    @Test
    void testRespondAndResolve() throws Exception {
        UUID issueId = UUID.randomUUID();
        IssueReport issue = new IssueReport();
        issue.setIssueId(issueId);

        IssueController.RespondRequest req = new IssueController.RespondRequest();
        req.setResponse("Sorry about that, refund issued.");
        req.setResolve(true);

        when(issueRepo.findById(issueId)).thenReturn(Optional.of(issue));
        when(issueRepo.save(any())).thenAnswer(i -> i.getArguments()[0]);

        mockMvc.perform(post("/api/issues/{id}/respond", issueId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").exists());
    }

    @Test
    void testResolveOnly() throws Exception {
        UUID issueId = UUID.randomUUID();
        IssueReport issue = new IssueReport();

        when(issueRepo.findById(issueId)).thenReturn(Optional.of(issue));
        when(issueRepo.save(any())).thenAnswer(i -> i.getArguments()[0]);

        mockMvc.perform(post("/api/issues/{id}/resolve", issueId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));
    }

    @Test
    void testResolve_NotFound() throws Exception {
        when(issueRepo.findById(any())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/issues/{id}/resolve", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDTOAccessors() {
        IssueController.CreateIssueRequest req = new IssueController.CreateIssueRequest();
        UUID id = UUID.randomUUID();
        req.setOrgId(id);
        assertEquals(id, req.getOrgId());

        IssueController.RespondRequest resp = new IssueController.RespondRequest();
        resp.setResolve(true);
        assertTrue(resp.isResolve());
    }
}
