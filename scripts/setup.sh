#!/bin/bash
set -e

echo "🚀 Behavioral Drift Detector — Quick Start"
echo "─────────────────────────────────────────"

# Check Ollama
if ! command -v ollama &> /dev/null; then
  echo "❌ Ollama not found. Install it: brew install ollama"
  exit 1
fi

# Check models
echo "📦 Checking Ollama models..."
if ! ollama list | grep -q "llama3.2"; then
  echo "  Pulling llama3.2 (~2GB)..."
  ollama pull llama3.2
fi
if ! ollama list | grep -q "mistral"; then
  echo "  Pulling mistral (~4GB)..."
  ollama pull mistral
fi
echo "  ✓ Models ready"

# Backend setup
echo ""
echo "🐍 Setting up Python backend..."
cd backend
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  Please edit backend/.env with your Supabase credentials, then re-run."
  echo "   Get them from: https://supabase.com/dashboard/project/_/settings/api"
  exit 0
fi

echo "  ✓ Backend ready"
echo ""
echo "✅ Setup complete! Start your servers:"
echo ""
echo "  Terminal 1 (backend):"
echo "    cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "  Terminal 2 (frontend):"
echo "    cd frontend && npm install && npm run dev"
echo ""
echo "  Then open: http://localhost:3000/dashboard"
