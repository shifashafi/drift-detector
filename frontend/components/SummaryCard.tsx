export function SummaryCard({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "1.25rem",
    }}>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 600, color: danger ? "var(--red)" : "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </p>
    </div>
  );
}
