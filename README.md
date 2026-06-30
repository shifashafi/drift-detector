# Behavioral Drift Detector

> Know when your LLM starts behaving differently — before your users do.

![Status](https://img.shields.io/badge/status-active-22d98a?style=flat-square) ![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20FastAPI%20%7C%20Ollama-6c63ff?style=flat-square) ![Cost](https://img.shields.io/badge/cost-$0-22d98a?style=flat-square)

## The Problem

Every team deploying LLMs faces the same invisible problem: models silently change. A provider updates their model, your prompts drift slightly, or data distribution shifts — and suddenly your LLM gives different answers than last week. There's no open-source tooling to catch this. This project builds it.

## What It Does

- **Define behavioral baselines** — write test cases (prompts + expected behavior) once
- **Auto-runs evals on a schedule** — every 30 minutes, fully automated
- **Scores semantic drift** — compares outputs using embeddings, not string matching
- **Detects contradictions** — a second LLM judges what specifically changed and why
- **Visualizes drift over time** — heatmap dashboard with trend analysis per test case
- **Alerts on real drift** — Slack/Discord webhook fires only on statistically significant changes

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Next.js Dashboard (Vercel)                         │
│  Drift heatmap · Trend lines · Alert banner         │
└──────────────────────┬──────────────────────────────┘
                       │ REST
┌──────────────────────▼──────────────────────────────┐
│  FastAPI Backend                                     │
│  Eval runner → Drift scorer → Contradiction judge   │
│                                                      │
│  Ollama (local)          sentence-transformers       │
│  llama3.2 (test model)   all-MiniLM-L6-v2           │
│  mistral  (judge model)  cosine similarity scoring  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Supabase (free tier)                               │
│  test_cases · runs · drift_scores                   │
└─────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Two-model setup** — `llama3.2` runs test cases; `mistral` acts as independent judge. Using the same model to judge itself introduces self-preference bias, so they're always separate.
- **Embedding-based scoring** — cosine similarity between sentence embeddings captures meaning shifts, not just wording changes. "The method outputs a result" and "The function returns a value" score as near-identical, as they should.
- **Z-score significance check** — new drift scores are compared against a rolling window of historical scores. Only statistically significant deviations (z > 2.0) trigger alerts, preventing noise from flooding you with false positives.
- **Local-first, zero cost** — all inference runs on Ollama locally. No API keys, no rate limits, no monthly bills.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| Inference | Ollama (llama3.2 + mistral) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Database | Supabase (PostgreSQL) |
| Scheduling | APScheduler |
| Hosting | Vercel + Render (free tiers) |

## Setup

### Prerequisites
```bash
brew install ollama
ollama pull llama3.2
ollama pull mistral
```

### Backend
```bash
cd backend
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add Supabase credentials
uvicorn app.main:app --reload --port 8000
```

### Database
Paste `docs/schema.sql` into your Supabase SQL editor and run it.

### Frontend
```bash
cd frontend
npm install && npm run dev
```

Open `http://localhost:3000/dashboard`

## How Drift Scoring Works

```
baseline output → embed → vector A ─┐
                                     ├─ cosine similarity → drift score (0.0–1.0)
new output      → embed → vector B ─┘

< 0.05   stable    essentially identical
0.05–0.15  low     minor wording variation
0.15–0.30  medium  semantic shift → contradiction analysis triggered
> 0.30   high      statistically significant → alert fires
```

## Project Structure

```
drift-detector/
├── backend/
│   ├── app/
│   │   ├── api/          # REST endpoints
│   │   ├── core/         # DB client, scheduler
│   │   ├── models/       # Pydantic schemas
│   │   └── services/     # LLM, scorer, runner, alerts
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── dashboard/    # Main heatmap view
    │   └── test-cases/   # CRUD for test cases
    ├── components/
    └── lib/api.ts        # Typed API client
```

## License
MIT