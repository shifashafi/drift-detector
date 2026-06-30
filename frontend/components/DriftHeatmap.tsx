"use client";
import { DriftSummary } from "@/lib/api";

function scoreColor(score: number) {
  if (score < 0.05) return { bg: "rgba(34,217,138,0.12)", border: "rgba(34,217,138,0.3)", text: "#22d98a" };
  if (score < 0.15) return { bg: "rgba(245,197,66,0.12)", border: "rgba(245,197,66,0.3)", text: "#f5c542" };
  if (score < 0.30) return { bg: "rgba(245,131,74,0.12)", border: "rgba(245,131,74,0.3)", text: "#f5834a" };
  return { bg: "rgba(245,74,74,0.12)", border: "rgba(245,74,74,0.3)", text: "#f54a4a" };
}

const TREND = { stable: { icon: "→", color: "#8888aa" }, degrading: { icon: "↗", color: "#f5834a" }, improving: { icon: "↘", color: "#22d98a" } };

export function DriftHeatmap({ summaries }: { summaries: DriftSummary[] }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 100px 80px 90px",
        padding: "10px 20px",
        borderBottom: "1px solid var(--border)",
        fontSize: 11, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.06em",
        fontWeight: 500,
      }}>
        <span>Test case</span>
        <span>Run history</span>
        <span style={{ textAlign: "right" }}>Latest score</span>
        <span style={{ textAlign: "right" }}>7d avg</span>
        <span style={{ textAlign: "right" }}>Trend</span>
      </div>

      {summaries.map((s, i) => {
        const c = scoreColor(s.latest_score);
        const trend = TREND[s.trend] ?? TREND.stable;
        return (
          <div key={s.test_case_id} style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr 100px 80px 90px",
            padding: "14px 20px",
            borderBottom: i < summaries.length - 1 ? "1px solid var(--border)" : "none",
            alignItems: "center",
            transition: "background .15s",
            cursor: "default",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card-hover)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Name */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.test_case_name}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {s.last_drift_type !== "none" ? s.last_drift_type + " drift" : "no drift detected"}
              </p>
            </div>

            {/* Spark cells */}
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {s.history.map((h, idx) => {
                const hc = scoreColor(h.score);
                return (
                  <div key={idx} title={`Score: ${h.score.toFixed(3)}\n${new Date(h.created_at).toLocaleString()}`}
                    style={{
                      width: 22, height: 22, borderRadius: 4,
                      background: hc.bg, border: `1px solid ${hc.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                      color: hc.text, fontWeight: 500,
                    }}>
                    {h.score.toFixed(1).replace("0.", ".")}
                  </div>
                );
              })}
            </div>

            {/* Latest score */}
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                padding: "3px 10px", borderRadius: 6,
                background: c.bg, color: c.text, border: `1px solid ${c.border}`,
              }}>
                {s.latest_score.toFixed(3)}
              </span>
            </div>

            {/* 7d avg */}
            <div style={{ textAlign: "right", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
              {s.avg_score_7d.toFixed(3)}
            </div>

            {/* Trend */}
            <div style={{ textAlign: "right", fontSize: 12, color: trend.color, fontWeight: 500 }}>
              {trend.icon} {s.trend}
            </div>
          </div>
        );
      })}
    </div>
  );
}
