#!/usr/bin/env bash
# One-shot setup: Python venv + Ollama model + Next.js dependencies.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Backend (Python)"
python3 -m venv backend/.venv
# shellcheck disable=SC1091
source backend/.venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f backend/videos.txt ] || cp backend/videos.example.txt backend/videos.txt

if command -v ollama >/dev/null 2>&1; then
  echo "==> Pulling Llama 3.2 (Ollama)"
  ollama pull llama3.2
else
  echo "!! Ollama not found. Install it from https://ollama.com/download and run: ollama pull llama3.2"
fi

echo "==> Frontend (Next.js)"
python scripts/generate_demo_dataset.py   # demo data so the UI works immediately
(cd frontend && npm install)

cat <<'MSG'

Done. Next steps:
  1. Edit backend/.env (API keys) and backend/videos.txt (5 YouTube videos).
  2. Run the pipeline:
       source backend/.venv/bin/activate
       python backend/pipeline.py --sync-frontend
  3. Start the dashboard:
       cd frontend && npm run dev     # http://localhost:3000
MSG
