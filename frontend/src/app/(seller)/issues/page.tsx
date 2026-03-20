"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/store/auth.store";
import { issuesApi } from "@/lib/api/api";
import type { IssueReport } from "@/lib/api/types";

export default function SellerIssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "RESPONDED" | "RESOLVED">("ALL");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sellerId = user?.profileId;
  const token = user?.token;

  const loadIssues = useCallback(async () => {
    if (!sellerId || !token) return;
    setLoading(true);
    try {
      const data = await issuesApi.bySeller(sellerId, token);
      setIssues(data);
    } catch {
      setError("Failed to load issues.");
    } finally {
      setLoading(false);
    }
  }, [sellerId, token]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleRespond = async (issueId: string, resolve: boolean) => {
    if (!token || !responseText.trim()) return;
    setSubmitting(true);
    try {
      await issuesApi.respond(issueId, { response: responseText, resolve }, token);
      setRespondingTo(null);
      setResponseText("");
      await loadIssues();
    } catch {
      setError("Failed to send response.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (issueId: string) => {
    if (!token) return;
    setSubmitting(true);
    try {
      await issuesApi.resolve(issueId, token);
      await loadIssues();
    } catch {
      setError("Failed to resolve issue.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = issues.filter((i) => filter === "ALL" || i.status === filter);

  const statusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "var(--error)";
      case "RESPONDED": return "var(--warning)";
      case "RESOLVED": return "var(--success-dark)";
      default: return "var(--muted)";
    }
  };

  if (!user || user.role !== "SELLER") {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Issues</h1>
          <p className="text-muted">Please log in as a seller to view issues.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <p className="text-muted">Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Issue Reports</h1>
        <p className="page-subtitle">View and respond to issues reported by organisations.</p>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      <div className="filters mt-4" style={{ marginBottom: "1.5rem" }}>
        {(["ALL", "OPEN", "RESPONDED", "RESOLVED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? "active" : ""}`}
          >
            {f === "ALL" ? `All (${issues.length})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${issues.filter((i) => i.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No {filter === "ALL" ? "" : filter.toLowerCase() + " "}issues found.</p>
        </div>
      ) : (
        <div className="grid" style={{ gap: "1rem" }}>
          {filtered.map((issue) => (
            <div key={issue.issueId} className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className="badge" style={{ backgroundColor: `color-mix(in srgb, ${statusColor(issue.status)} 15%, transparent)`, color: statusColor(issue.status) }}>
                    {issue.status}
                  </span>
                  <span className="badge badge-warning">{issue.type}</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
                  {new Date(issue.createdAt).toLocaleDateString()}
                </span>
              </div>

              {issue.organisation && (
                <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", marginBottom: "0.5rem" }}>
                  Reported by: {issue.organisation.name}
                </p>
              )}

              <p style={{ marginBottom: "0.75rem", lineHeight: 1.5 }}>{issue.description}</p>

              {issue.sellerResponse && (
                <div style={{ padding: "0.75rem", backgroundColor: "var(--gray-50)", borderRadius: "0.5rem", marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.25rem" }}>Your response:</p>
                  <p style={{ fontSize: "0.9rem" }}>{issue.sellerResponse}</p>
                </div>
              )}

              {issue.status !== "RESOLVED" && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {respondingTo === issue.issueId ? (
                    <div style={{ width: "100%" }}>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response..."
                        className="input"
                        rows={3}
                        style={{ resize: "vertical", marginBottom: "0.5rem" }}
                        aria-label="Response text"
                      />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleRespond(issue.issueId, false)}
                          disabled={submitting || !responseText.trim()}
                        >
                          {submitting ? "Sending..." : "Send Response"}
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ backgroundColor: "var(--success-dark)" }}
                          onClick={() => handleRespond(issue.issueId, true)}
                          disabled={submitting || !responseText.trim()}
                        >
                          Respond & Resolve
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => { setRespondingTo(null); setResponseText(""); }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => setRespondingTo(issue.issueId)}
                      >
                        Respond
                      </button>
                      {issue.status === "RESPONDED" && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleResolve(issue.issueId)}
                          disabled={submitting}
                        >
                          Mark Resolved
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {issue.resolvedAt && (
                <p style={{ fontSize: "0.85rem", color: "var(--success-dark)", marginTop: "0.5rem" }}>
                  Resolved on {new Date(issue.resolvedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
