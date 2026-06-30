from pydantic import BaseModel, Field
from typing import Optional, Literal
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


# ── Test Case ──────────────────────────────────────────────────────────────

class TestCaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    input_prompt: str = Field(..., min_length=1)
    expected_tone: Optional[Literal["formal", "casual", "technical", "empathetic"]] = None
    expected_topics: list[str] = Field(default_factory=list)
    should_refuse: bool = False
    model_name: str = Field(default="llama3.2")


class TestCaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    input_prompt: Optional[str] = None
    expected_tone: Optional[str] = None
    expected_topics: Optional[list[str]] = None
    should_refuse: Optional[bool] = None
    model_name: Optional[str] = None
    is_active: Optional[bool] = None


class TestCase(BaseModel):
    id: str
    name: str
    description: Optional[str]
    input_prompt: str
    expected_tone: Optional[str]
    expected_topics: list[str]
    should_refuse: bool
    model_name: str
    is_active: bool
    baseline_output: Optional[str]
    baseline_embedding: Optional[list[float]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Run ────────────────────────────────────────────────────────────────────

class RunCreate(BaseModel):
    test_case_id: str
    triggered_by: Literal["scheduler", "manual"] = "manual"


class Run(BaseModel):
    id: str
    test_case_id: str
    model_name: str
    output: str
    latency_ms: int
    semantic_score: Optional[float]        # cosine similarity vs baseline (0-1)
    tone_score: Optional[float]
    refusal_detected: bool
    drift_score: float                     # composite 0-1 (higher = more drift)
    drift_type: DriftType
    drift_severity: DriftSeverity
    contradiction_report: Optional[dict]
    triggered_by: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Drift ──────────────────────────────────────────────────────────────────

class DriftSummary(BaseModel):
    test_case_id: str
    test_case_name: str
    latest_drift_score: float
    drift_type: DriftType
    drift_severity: DriftSeverity
    trend: Literal["improving", "stable", "degrading"]
    run_count: int
    last_run_at: Optional[datetime]


class DriftAlert(BaseModel):
    id: str
    test_case_id: str
    test_case_name: str
    drift_type: DriftType
    severity: DriftSeverity
    drift_score: float
    explanation: str
    created_at: datetime


class ContradictionReport(BaseModel):
    has_contradiction: bool
    dimensions: list[str]       # which behavioral dimensions changed
    explanation: str
    confidence: float           # 0-1
