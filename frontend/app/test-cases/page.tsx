"use client";
import { useEffect, useState } from "react";
import { getTestCases, createTestCase, deleteTestCase, triggerRun, TestCase, TestCaseCreate } from "@/lib/api";

const EMPTY: TestCaseCreate = {
  name: "",
  description: "",
  input_prompt: "",
  expected_tone: "",
  expected_refusal: false,
  model_name: "llama3.2",
};

export default function TestCasesPage() {
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TestCaseCreate>(EMPTY);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setCases(await getTestCases()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async () => {
    if (!form.name || !form.input_prompt) return;
    setAdding(true);
    try {
      await createTestCase(form);
      setForm(EMPTY);
      setShowForm(false);
      await load();
      showToast("Test case created ✓");
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteTestCase(id);
    await load();
    showToast("Deleted");
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      await triggerRun(id);
      showToast("Eval triggered — check dashboard for results");
    } finally { setRunningId(null); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid var(--border)", padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56, position: "sticky", top: 0,
        background: "rgba(10,10,15,0.85)", backdropFilter: "blur(12px)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--accent-glow)", border: "1px solid rgba(108,99,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="var(--accent)"/>
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <a href="/dashboard" style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)", textDecoration: "none" }}>
            Drift Detector
          </a>
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Test Cases</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/dashboard" style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 13,
            border: "1px solid var(--border-strong)", background: "transparent",
            color: "var(--text-secondary)", cursor: "pointer", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            ← Dashboard
          </a>
          <button onClick={() => setShowForm(true)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: "1px solid rgba(108,99,255,0.4)",
            background: "rgba(108,99,255,0.2)", color: "var(--accent)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            + New test case
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>

        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 6 }}>
            Test cases
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Each test case is a prompt you run against your model on a schedule. Drift is measured by comparing each new output to the first (baseline) run.
          </p>
        </div>

        {/* Add form modal */}
        {showForm && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
            backdropFilter: "blur(4px)",
          }}>
            <div style={{
              background: "#13131a", border: "1px solid var(--border-strong)",
              borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 560,
              maxHeight: "90vh", overflowY: "auto",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>New test case</h2>
                <button onClick={() => setShowForm(false)} style={{
                  background: "transparent", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", fontSize: 20, lineHeight: 1,
                }}>×</button>
              </div>

              {[
                { label: "Name", key: "name", placeholder: "e.g. Tone consistency check" },
                { label: "Description", key: "description", placeholder: "What behavior are you monitoring?" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {f.label}
                  </label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13,
                      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-strong)",
                      color: "var(--text-primary)", outline: "none",
                    }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Prompt (what gets sent to the model)
                </label>
                <textarea
                  value={form.input_prompt}
                  onChange={e => setForm(p => ({ ...p, input_prompt: e.target.value }))}
                  placeholder="e.g. Explain recursion to a 10-year-old."
                  rows={4}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13,
                    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-strong)",
                    color: "var(--text-primary)", outline: "none", resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Expected tone (optional)
                  </label>
                  <input
                    value={form.expected_tone ?? ""}
                    onChange={e => setForm(p => ({ ...p, expected_tone: e.target.value }))}
                    placeholder="e.g. friendly, formal"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13,
                      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-strong)",
                      color: "var(--text-primary)", outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Model
                  </label>
                  <select
                    value={form.model_name}
                    onChange={e => setForm(p => ({ ...p, model_name: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13,
                      background: "#13131a", border: "1px solid var(--border-strong)",
                      color: "var(--text-primary)", outline: "none",
                    }}
                  >
                    <option value="llama3.2">llama3.2</option>
                    <option value="mistral">mistral</option>
                    <option value="llama3.1">llama3.1</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem" }}>
                <input
                  type="checkbox"
                  id="refusal"
                  checked={form.expected_refusal}
                  onChange={e => setForm(p => ({ ...p, expected_refusal: e.target.checked }))}
                  style={{ accentColor: "var(--accent)", width: 14, height: 14 }}
                />
                <label htmlFor="refusal" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                  Model should refuse this prompt
                </label>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13,
                  border: "1px solid var(--border-strong)", background: "transparent",
                  color: "var(--text-secondary)", cursor: "pointer",
                }}>
                  Cancel
                </button>
                <button onClick={handleAdd} disabled={adding || !form.name || !form.input_prompt} style={{
                  padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: "1px solid rgba(108,99,255,0.4)",
                  background: "rgba(108,99,255,0.2)", color: "var(--accent)",
                  cursor: adding ? "not-allowed" : "pointer", opacity: adding ? 0.6 : 1,
                }}>
                  {adding ? "Creating…" : "Create test case"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>
        ) : cases.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "4rem 0",
            border: "1px dashed var(--border-strong)", borderRadius: 16,
          }}>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 12 }}>No test cases yet</p>
            <button onClick={() => setShowForm(true)} style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: "1px solid rgba(108,99,255,0.4)", background: "rgba(108,99,255,0.2)",
              color: "var(--accent)", cursor: "pointer",
            }}>
              + Create your first test case
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cases.map((tc) => (
              <div key={tc.id} style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "16px 20px",
                display: "flex", alignItems: "flex-start", gap: 16,
                transition: "border-color .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                  background: tc.is_active ? "var(--green)" : "var(--text-muted)",
                  boxShadow: tc.is_active ? "0 0 6px var(--green)" : "none",
                }}/>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{tc.name}</h3>
                    <span style={{
                      fontSize: 11, padding: "1px 7px", borderRadius: 10,
                      background: "rgba(108,99,255,0.1)", color: "var(--accent)",
                      border: "1px solid rgba(108,99,255,0.2)",
                    }}>{tc.model_name}</span>
                    {tc.expected_refusal && (
                      <span style={{
                        fontSize: 11, padding: "1px 7px", borderRadius: 10,
                        background: "rgba(245,74,74,0.1)", color: "var(--red)",
                        border: "1px solid rgba(245,74,74,0.2)",
                      }}>refusal</span>
                    )}
                    {tc.expected_tone && (
                      <span style={{
                        fontSize: 11, padding: "1px 7px", borderRadius: 10,
                        background: "rgba(34,217,138,0.1)", color: "var(--green)",
                        border: "1px solid rgba(34,217,138,0.2)",
                      }}>tone: {tc.expected_tone}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{tc.description}</p>
                  <p style={{
                    fontSize: 12, color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: 6,
                    border: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {tc.input_prompt}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleRun(tc.id)}
                    disabled={runningId === tc.id}
                    title="Run eval now"
                    style={{
                      padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                      border: "1px solid rgba(108,99,255,0.3)", background: "rgba(108,99,255,0.1)",
                      color: "var(--accent)", cursor: "pointer", opacity: runningId === tc.id ? 0.5 : 1,
                    }}>
                    {runningId === tc.id ? "Running…" : "▶ Run"}
                  </button>
                  <button
                    onClick={() => handleDelete(tc.id, tc.name)}
                    title="Delete"
                    style={{
                      padding: "6px 10px", borderRadius: 7, fontSize: 12,
                      border: "1px solid rgba(245,74,74,0.2)", background: "rgba(245,74,74,0.05)",
                      color: "var(--red)", cursor: "pointer",
                    }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: "#1a1a26", border: "1px solid var(--border-strong)",
          borderRadius: 10, padding: "10px 18px", fontSize: 13,
          color: "var(--text-primary)", zIndex: 100,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "slideUp .2s ease",
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
