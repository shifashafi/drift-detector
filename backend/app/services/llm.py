import httpx
import time
import json
from typing import Optional


OLLAMA_BASE = "http://localhost:11434"


async def generate(
    prompt: str,
    model: str = "llama3.2",
    system: Optional[str] = None,
    json_mode: bool = False,
) -> tuple[str, int]:
    """
    Call Ollama and return (response_text, latency_ms).
    Runs 100% locally — no API keys, no rate limits.
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.1},  # low temp for consistent evals
    }
    if system:
        payload["system"] = system
    if json_mode:
        payload["format"] = "json"

    start = time.monotonic()
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{OLLAMA_BASE}/api/generate", json=payload)
        resp.raise_for_status()

    latency_ms = int((time.monotonic() - start) * 1000)
    data = resp.json()
    return data["response"].strip(), latency_ms


async def list_local_models() -> list[str]:
    """Return all models currently pulled in Ollama."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{OLLAMA_BASE}/api/tags")
        resp.raise_for_status()
    return [m["name"] for m in resp.json().get("models", [])]


async def analyze_contradiction(
    original_output: str,
    new_output: str,
    context: str,
    judge_model: str = "mistral",
) -> dict:
    """
    Use a second model as judge to detect behavioral contradictions.
    Returns structured JSON report.
    """
    system = (
        "You are an expert LLM evaluator. "
        "Analyze two responses to the same prompt and identify behavioral contradictions. "
        "Respond ONLY with valid JSON."
    )
    prompt = f"""Context / original prompt: {context}

Response A (baseline):
{original_output}

Response B (new):
{new_output}

Return JSON with this exact structure:
{{
  "has_contradiction": true/false,
  "contradiction_type": "tone|factual|refusal|format|none",
  "severity": "low|medium|high|critical",
  "explanation": "one sentence explaining the key difference",
  "specific_changes": ["change 1", "change 2"]
}}"""

    raw, _ = await generate(prompt, model=judge_model, system=system, json_mode=True)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "has_contradiction": False,
            "contradiction_type": "none",
            "severity": "low",
            "explanation": "Could not parse judge response",
            "specific_changes": [],
        }
