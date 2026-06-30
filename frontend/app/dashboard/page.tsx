"use client";
import { useEffect, useState } from "react";
import { getDriftSummary, triggerFullSuite, DriftSummary } from "@/lib/api";
import { DriftHeatmap } from "@/components/DriftHeatmap";
import { AlertBanner } from "@/components/AlertBanner";

export default function Dashboard() {
  const [summaries, setSummaries] = useState<DriftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setSummaries(await getDriftSummary()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleTrigger = async () => {
    setRunning(true);
    await triggerFullSuite();
    setTimeout(() => {
      setRunning(false);
      setLastRun(new Date().toLocaleTimeString());
      load();
    }, 4000);
  };

  const alerts = summaries.filter((s) => s.alert_triggered);
  const avgDrift = summaries.length
    ? summaries.reduce((a, s) => a + s.latest_score, 0) / summaries.length : 0;
  const stable = summaries.filter(s => s.latest_score < 0.05).length;
  const drifting = summaries.filter(s => s.latest_score >= 0.15).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Top nav */}
      <nav style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
        position: "sticky",
        top: 0,
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--accent-glow)",
            border: "1px solid rgba(108,99,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="var(--accent)"/>
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3 3l1.4 1.4M9.6 9.6L11 11M3 11l1.4-1.4M9.6 4.4L11 3" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>
          <span style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            Drift Detector
          </span>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 20,
            background: "var(--accent-glow)", color: "var(--accent)",
            border: "1px solid rgba(108,99,255,0.25)", fontWeight: 500,
          }}>LIVE</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastRun && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Last run {lastRun}
            </span>
          )}
          <button onClick={load} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 13,
            border: "1px solid var(--border-strong)", background: "transparent",
            color: "var(--text-secondary)", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6 1.5L8 3.5M6 1.5L8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
          <button onClick={handleTrigger} disabled={running} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: "1px solid rgba(108,99,255,0.4)",
            background: running ? "var(--accent-glow)" : "rgba(108,99,255,0.2)",
            color: running ? "var(--text-secondary)" : "var(--accent)",
            cursor: running ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6, transition: "all .2s",
          }}>
            {running ? (
              <>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 1s infinite" }}/>
                Running…
              </>
            ) : (
              <>
                <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                  <path d="M1 1l8 5-8 5V1z"/>
                </svg>
                Run evals
              </>
            )}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>

        {/* Hero section */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{
            fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em",
            color: "var(--text-primary)", marginBottom: 6,
          }}>
            Behavioral monitoring
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Detect when your LLM starts responding differently — before your users notice.
          </p>
        </div>

        {alerts.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <AlertBanner alerts={alerts} />
          </div>
        )}

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "2rem" }}>
          {[
            { label: "Test cases", value: summaries.length, sub: "being monitored" },
            { label: "Avg drift", value: avgDrift.toFixed(3), sub: "across all cases", color: avgDrift > 0.15 ? "var(--orange)" : avgDrift > 0.05 ? "var(--yellow)" : "var(--green)" },
            { label: "Stable", value: stable, sub: "score below 0.05", color: "var(--green)" },
            { label: "Drifting", value: drifting, sub: "score above 0.15", color: drifting > 0 ? "var(--orange)" : "var(--text-secondary)" },
          ].map((card) => (
            <div key={card.label} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12, padding: "1.25rem",
            }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {card.label}
              </p>
              <p style={{ fontSize: 26, fontWeight: 600, color: card.color ?? "var(--text-primary)", letterSpacing: "-0.02em", fontFamily: "'JetBrains Mono', monospace" }}>
                {card.value}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        {!loading && summaries.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Drift heatmap
              </h2>
              <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-muted)" }}>
                {[
                  { color: "var(--green)", label: "stable <0.05" },
                  { color: "var(--yellow)", label: "low 0.05–0.15" },
                  { color: "var(--orange)", label: "medium 0.15–0.30" },
                  { color: "var(--red)", label: "high >0.30" },
                ].map(l => (
                  <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: "inline-block" }}/>
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            <DriftHeatmap summaries={summaries} />
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)", fontSize: 14 }}>
            Loading…
          </div>
        )}

        {!loading && summaries.length === 0 && (
          <div style={{
            textAlign: "center", padding: "5rem 0",
            border: "1px dashed var(--border-strong)", borderRadius: 16,
          }}>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 8 }}>No test cases yet</p>
            <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Add one via POST /api/test-cases/</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
