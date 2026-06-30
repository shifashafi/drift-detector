from fastapi import APIRouter
from app.core.database import get_supabase

router = APIRouter()


@router.get("/summary")
def drift_summary():
    """
    Per-test-case drift summary: latest score, 7-day avg, trend direction.
    This powers the dashboard heatmap and summary cards.
    """
    db = get_supabase()
    test_cases = db.table("test_cases").select("id, name").eq("is_active", True).execute()
    summaries = []

    for tc in test_cases.data:
        runs = (
            db.table("runs")
            .select("drift_score, drift_type, created_at")
            .eq("test_case_id", tc["id"])
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        ).data

        if not runs:
            continue

        scores = [r["drift_score"] for r in runs]
        latest = scores[0]
        avg_7d = round(sum(scores[:7]) / min(len(scores), 7), 4)

        # Trend: compare first half vs second half of recent window
        if len(scores) >= 4:
            mid = len(scores) // 2
            recent_avg = sum(scores[:mid]) / mid
            older_avg = sum(scores[mid:]) / (len(scores) - mid)
            if recent_avg > older_avg + 0.05:
                trend = "degrading"
            elif recent_avg < older_avg - 0.05:
                trend = "improving"
            else:
                trend = "stable"
        else:
            trend = "stable"

        summaries.append({
            "test_case_id": tc["id"],
            "test_case_name": tc["name"],
            "latest_score": latest,
            "avg_score_7d": avg_7d,
            "trend": trend,
            "last_drift_type": runs[0]["drift_type"],
            "alert_triggered": latest >= 0.30,
            "history": [
                {"score": r["drift_score"], "created_at": r["created_at"]}
                for r in reversed(runs[:14])
            ],
        })

    return summaries


@router.get("/timeline/{tc_id}")
def drift_timeline(tc_id: str, limit: int = 50):
    """Full score history for a single test case — used by the line chart."""
    db = get_supabase()
    runs = (
        db.table("runs")
        .select("drift_score, drift_type, drift_severity, latency_ms, created_at")
        .eq("test_case_id", tc_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return runs.data
