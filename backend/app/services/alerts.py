import os
import httpx
from typing import Optional


async def send_drift_alert(
    test_case_name: str,
    drift_score: float,
    drift_type: str,
    severity: str,
    contradiction: Optional[dict] = None,
):
    """
    POST to a Slack or Discord webhook when significant drift is detected.
    Set ALERT_WEBHOOK_URL in your .env to activate.
    Works with both Slack and Discord (both accept the same payload shape).
    """
    webhook_url = os.environ.get("ALERT_WEBHOOK_URL")
    if not webhook_url:
        print(f"[alert] No webhook set — drift {drift_score:.2f} on '{test_case_name}' not sent")
        return

    severity_emoji = {"low": "🟡", "medium": "🟠", "high": "🔴", "critical": "🚨"}.get(severity, "⚪")
    explanation = contradiction.get("explanation", "") if contradiction else ""

    payload = {
        "text": (
            f"{severity_emoji} *Behavioral Drift Detected* — `{test_case_name}`\n"
            f"> Score: `{drift_score:.3f}` | Type: `{drift_type}` | Severity: `{severity}`\n"
            + (f"> {explanation}" if explanation else "")
        )
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(webhook_url, json=payload)
        if resp.status_code not in (200, 204):
            print(f"[alert] Webhook failed: {resp.status_code} {resp.text}")
