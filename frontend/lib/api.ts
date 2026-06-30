const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

// ── Test Cases ──────────────────────────────────────────────────────────────

export const getTestCases = () => api<TestCase[]>("/api/test-cases/");

export const createTestCase = (body: TestCaseCreate) =>
  api<TestCase>("/api/test-cases/", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const toggleTestCase = (id: string) =>
  api<{ is_active: boolean }>(`/api/test-cases/${id}/toggle`, { method: "PATCH" });

export const deleteTestCase = (id: string) =>
  api<void>(`/api/test-cases/${id}`, { method: "DELETE" });

// ── Runs ─────────────────────────────────────────────────────────────────────

export const getRuns = (testCaseId?: string) =>
  api<Run[]>(`/api/runs/${testCaseId ? `?test_case_id=${testCaseId}` : ""}`);

export const triggerRun = (tcId: string) =>
  api<Run>(`/api/runs/trigger/${tcId}`, { method: "POST" });

export const triggerFullSuite = () =>
  api<{ message: string }>("/api/runs/trigger-all", { method: "POST" });

// ── Drift ─────────────────────────────────────────────────────────────────────

export const getDriftSummary = () => api<DriftSummary[]>("/api/drift/summary");

export const getDriftTimeline = (tcId: string) =>
  api<TimelinePoint[]>(`/api/drift/timeline/${tcId}`);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TestCaseCreate {
  name: string;
  description: string;
  input_prompt: string;
  expected_tone?: string;
  expected_topics?: string[];
  expected_refusal?: boolean;
  model_name?: string;
}

export interface TestCase extends TestCaseCreate {
  id: string;
  created_at: string;
  is_active: boolean;
}

export interface Run {
  id: string;
  test_case_id: string;
  model_name: string;
  raw_output: string;
  drift_score: number;
  drift_type: string;
  drift_severity: string | null;
  latency_ms: number;
  contradiction_report: ContradictionReport | null;
  created_at: string;
}

export interface ContradictionReport {
  has_contradiction: boolean;
  contradiction_type: string;
  severity: string;
  explanation: string;
  specific_changes: string[];
}

export interface DriftSummary {
  test_case_id: string;
  test_case_name: string;
  latest_score: number;
  avg_score_7d: number;
  trend: "stable" | "degrading" | "improving";
  last_drift_type: string;
  alert_triggered: boolean;
  history: { score: number; created_at: string }[];
}

export interface TimelinePoint {
  drift_score: number;
  drift_type: string;
  drift_severity: string | null;
  latency_ms: number;
  created_at: string;
}
