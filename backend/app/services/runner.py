"""
Eval runner: the heart of the system.
For each active test case:
  1. Run the prompt against Ollama
  2. Score drift vs baseline (first run = baseline)
  3. If drift is significant, run contradiction analysis
  4. Store everything in Supabase
  5. Trigger alerts if threshold exceeded
"""
import uuid
from datetime import datetime, timezone

from app.core.database import get_supabase
from app.services.llm import generate, analyze_contradiction
from app.services.scorer import score_drift, classify_severity, is_statistically_significant
from app.services.alerts import send_drift_alert


ALERT_THRESHOLD = 0.30   # drift score that triggers a webhook alert


async def run_eval_suite():
    """Run all active test cases. Called by the scheduler."""
    db = get_supabase()
    test_cases = db.table("test_cases").select("*").eq("is_active", True).execute()

    for tc in test_cases.data:
        try:
            await run_single_eval(tc)
        except Exception as e:
            print(f"[runner] Error on test case {tc['id']}: {e}")


async def run_single_eval(tc: dict) -> dict:
    db = get_supabase()

    # 1. Run the model
    raw_output, latency_ms = await generate(
        prompt=tc["input_prompt"],
        model=tc["model_name"],
    )

    # 2. Fetch baseline (first-ever run for this test case)
    baseline_run = (
        db.table("runs")
        .select("raw_output, drift_score")
        .eq("test_case_id", tc["id"])
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )

    drift_score = 0.0
    drift_type = "none"
    drift_severity = None
    contradiction_report = None

    if baseline_run.data:
        baseline_text = baseline_run.data[0]["raw_output"]

        # 3. Score semantic drift
        drift_score = score_drift(baseline_text, raw_output)
        severity_label = classify_severity(drift_score)

        # Check statistical significance vs recent history (last 10 runs)
        recent = (
            db.table("runs")
            .select("drift_score")
            .eq("test_case_id", tc["id"])
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        historical_scores = [r["drift_score"] for r in recent.data]
        significant = is_statistically_significant(historical_scores, drift_score)

        if significant and drift_score > 0.05:
            drift_type = "semantic"
            drift_severity = severity_label

            # 4. Contradiction analysis (only when drift is meaningful)
            if drift_score > 0.15:
                contradiction_report = await analyze_contradiction(
                    original_output=baseline_text,
                    new_output=raw_output,
                    context=tc["input_prompt"],
                )
                # Refine drift type from judge
                if contradiction_report.get("contradiction_type") != "none":
                    drift_type = contradiction_report["contradiction_type"]

        # 5. Alert if above threshold
        if drift_score >= ALERT_THRESHOLD:
            await send_drift_alert(
                test_case_name=tc["name"],
                drift_score=drift_score,
                drift_type=drift_type,
                severity=severity_label,
                contradiction=contradiction_report,
            )

    # 6. Store run in Supabase
    run_record = {
        "id": str(uuid.uuid4()),
        "test_case_id": tc["id"],
        "model_name": tc["model_name"],
        "raw_output": raw_output,
        "drift_score": drift_score,
        "drift_type": drift_type,
        "drift_severity": drift_severity,
        "latency_ms": latency_ms,
        "contradiction_report": contradiction_report,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.table("runs").insert(run_record).execute()
    return run_record
