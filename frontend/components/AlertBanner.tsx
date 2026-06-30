import { DriftSummary } from "@/lib/api";

export function AlertBanner({ alerts }: { alerts: DriftSummary[] }) {
  return (
    <div style={{
      background: "rgba(245,74,74,0.06)",
      border: "1px solid rgba(245,74,74,0.25)",
      borderRadius: 12, padding: "14px 18px",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: "rgba(245,74,74,0.15)", border: "1px solid rgba(245,74,74,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 2v3M5 7.5v.5" stroke="#f54a4a" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#f54a4a", marginBottom: 6 }}>
          {alerts.length} test case{alerts.length > 1 ? "s" : ""} exceeded drift threshold
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {alerts.map((a) => (
            <p key={a.test_case_id} style={{ fontSize: 12, color: "rgba(245,74,74,0.7)" }}>
              <span style={{ color: "#f54a4a", fontWeight: 500 }}>{a.test_case_name}</span>
              {" "}— score {a.latest_score.toFixed(3)} · {a.last_drift_type} drift
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
