# Behavioral Drift Detector

> Detect when your LLM starts behaving differently over time — before your users notice.

Every team deploying LLMs faces the same invisible problem: models silently change. A cloud provider updates their model, your prompt templates shift slightly, or data distribution creeps — and suddenly your LLM is giving different answers than it was last week. There's no open-source tooling for this. This project builds it.

---

## What it does

- **Defines behavioral baselines** via golden test cases (prompt + expected behavior)
- **Runs evals on a schedule** using local Ollama models (zero cost, zero rate limits)
- **Scores semantic drift** with sentence-transformers — detecting when outputs drift in meaning, not just wording
- **Classifies contradictions** using a second LLM-as-judge model
- **Visualizes drift over time** with a heatmap dashboard + timeline charts
- **Alerts via webhook** (Slack/Discord) when drift exceeds your threshold

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Next.js Dashboard                                   │
│  Heatmap · Timeline · Test Case Manager · Alerts    │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│  FastAPI Backend                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Eval Runner │  │ Drift Scorer │  │  Scheduler │ │
│  │ (runner.py) │  │ (scorer.py)  │  │  (30 min)  │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────┘ │
│         │                │                          │
│  ┌──────▼──────┐  ┌──────▼───────┐                  │
│  │  Ollama     │  │ sentence-    │                  │
│  │  (local)    │  │ transformers │                  │
│  │  llama3.2   │  │ (local)      │                  │
│  │  + mistral  │  └──────────────┘                  │
│  └─────────────┘                                    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Supabase (free tier)                               │
│  test_cases · runs · drift scores                   │
└─────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **Local-first**: All inference runs on Ollama — no API keys, no rate limits, no costs
- **Two-model setup**: `llama3.2` runs test cases; `mistral` acts as independent judge for contradiction detection — avoids self-preference bias
- **Statistical significance**: z-score check prevents noise from triggering false alerts
- **Embedding-based scoring**: Captures semantic meaning shifts, not just string differences

---

## Setup

### Prerequisites

```bash
# Install Ollama (Mac)
brew install ollama
ollama serve                  # start in background

# Pull the two models used
ollama pull llama3.2          # ~2GB - the test model
ollama pull mistral           # ~4GB - the judge model
```

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Open the SQL editor and paste the contents of `docs/schema.sql`
3. Copy your project URL and service role key from Settings → API

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your Supabase credentials

uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs to see the API explorer.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open http://localhost:3000/dashboard

### 4. First eval run

Either wait 30 minutes for the scheduler, or hit the "Run Evals Now" button in the dashboard — or via API:

```bash
curl -X POST http://localhost:8000/api/runs/trigger-all
```

---

## Adding test cases

Via the dashboard UI, or directly via API:

```bash
curl -X POST http://localhost:8000/api/test-cases/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tone consistency check",
    "description": "Model should always be helpful and professional",
    "input_prompt": "Explain recursion to a 10-year-old.",
    "expected_tone": "friendly",
    "model_name": "llama3.2"
  }'
```

---

## Deployment (free)

| Service | What it hosts | Free tier |
|---------|--------------|-----------|
| Vercel | Next.js frontend | Unlimited hobby |
| Render | FastAPI backend | 750 hrs/month |
| Supabase | PostgreSQL | 500MB, 2 projects |

**Note:** Render free tier spins down after 15 min inactivity. For always-on eval scheduling, use Oracle Cloud Always Free (4 OCPUs, 24GB RAM) to host the backend.

```bash
# Deploy frontend
cd frontend && npx vercel

# Deploy backend (push to GitHub, connect to Render)
# Set environment variables in Render dashboard
```

---

## Tech Stack

**Backend:** Python · FastAPI · Ollama · sentence-transformers · APScheduler · Supabase
**Frontend:** Next.js 14 · TypeScript · Tailwind CSS · Recharts
**Models (local):** llama3.2 (test model) · mistral (judge model)
**Infrastructure:** Vercel · Render · Supabase
