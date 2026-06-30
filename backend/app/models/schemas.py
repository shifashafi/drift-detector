from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DriftType(str, Enum):
    semantic = "semantic"
    tone = "tone"
    refusal = "refusal"
    latency = "latency"
    none = "none"


class DriftSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


# ── Test Case ──────────────────────────────────────────────────────────────────

class TestCaseCreate(BaseModel):
    name: str
    description: str
    input_prompt: str
    expected_tone: Optional[str] = None          # e.g. "helpful", "neutral", "formal"
    expected_topics: Optional[List[str]] = []    # topics the response should cover
    expected_refusal: bool = False               # should the model refuse this?
    model_name: str = "llama3.2"                 # Ollama model to test


class TestCase(TestCaseCreate):
    id: str
    created_at: datetime
    is_active: bool = True


# ── Eval Run ───────────────────────────────────────────────────────────────────

class RunResult(BaseModel):
    id: str
    test_case_id: str
    model_name: str
    raw_output: str
    drift_score: float                           # 0.0 = identical, 1.0 = completely different
    drift_type: DriftType = DriftType.none
    drift_severity: Optional[DriftSeverity] = None
    latency_ms: int
    contradiction_report: Optional[dict] = None
    created_at: datetime


# ── Drift Summary ──────────────────────────────────────────────────────────────

class DriftSummary(BaseModel):
    test_case_id: str
    test_case_name: str
    latest_score: float
    avg_score_7d: float
    trend: str                                   # "stable", "degrading", "improving"
    last_drift_type: DriftType
    alert_triggered: bool
