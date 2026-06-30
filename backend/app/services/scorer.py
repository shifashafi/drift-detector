from __future__ import annotations
import numpy as np
from functools import lru_cache

# Lazy-load so startup is fast; model downloads once (~80MB) then caches
@lru_cache(maxsize=1)
def _get_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("all-MiniLM-L6-v2")  # fast, 80MB, runs on CPU


def embed(text: str) -> np.ndarray:
    model = _get_model()
    return model.encode(text, normalize_embeddings=True)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Returns 0.0 (identical) to 1.0 (completely different)."""
    similarity = float(np.dot(a, b))          # embeddings already normalized
    drift_score = round(1.0 - similarity, 4)
    return max(0.0, min(1.0, drift_score))    # clamp to [0, 1]


def score_drift(baseline_text: str, new_text: str) -> float:
    """Main entry point: compare two LLM outputs, return drift score."""
    a = embed(baseline_text)
    b = embed(new_text)
    return cosine_similarity(a, b)


def classify_severity(score: float) -> str:
    """
    Thresholds tuned empirically:
    - < 0.05 : essentially identical phrasing
    - 0.05–0.15 : minor wording variation (low)
    - 0.15–0.30 : meaningful semantic shift (medium)
    - 0.30–0.50 : significant behavioral change (high)
    - > 0.50 : the model is saying something fundamentally different (critical)
    """
    if score < 0.05:
        return "none"
    elif score < 0.15:
        return "low"
    elif score < 0.30:
        return "medium"
    elif score < 0.50:
        return "high"
    else:
        return "critical"


def is_statistically_significant(scores: list[float], new_score: float, z_threshold: float = 2.0) -> bool:
    """
    Compare new_score against rolling history using z-score.
    Returns True if the new score is a statistically meaningful deviation.
    Requires at least 3 historical scores to be meaningful.
    """
    if len(scores) < 3:
        return False
    mean = np.mean(scores)
    std = np.std(scores)
    if std < 0.001:  # near-zero variance — model was very stable
        return new_score > 0.05
    z = abs(new_score - mean) / std
    return z > z_threshold
