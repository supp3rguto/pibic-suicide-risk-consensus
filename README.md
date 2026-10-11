# Tri-Model Consensus for Suicide-Risk Detection (PIBIC)

```
pibic-suicide-risk-consensus/
├── setup.sh
├── scripts/generate_demo_dataset.py     # synthetic demo data for the UI
├── backend/
│   ├── pipeline.py                      # extraction + 3 LLMs + metrics + export
│   ├── requirements.txt
│   ├── .env.example  /  videos.example.txt
└── frontend/                            # Next.js 15 + TypeScript + Tailwind 4
    ├── app/ (layout.tsx, page.tsx, arbitration/page.tsx, globals.css)
    ├── components/ (MetricsDashboard, ArbitrationPanel, ModelVoteCard, ...)
    ├── lib/ (types, metrics, labels, export, useGroundTruth, dataset)
    └── data/dataset_results.json        # pipeline output (demo data by default)
```

## Run locally
```bash
./setup.sh
# edit backend/.env and backend/videos.txt
source backend/.venv/bin/activate
python backend/pipeline.py --sync-frontend
cd frontend && npm run dev
```

## Deploy to Vercel
1. Run the pipeline with `--sync-frontend` and commit `frontend/data/dataset_results.json`.
2. Import the repo in Vercel and set **Root Directory = `frontend`**. No env vars are needed.
3. Ground-truth decisions are kept in the reviewer's browser (localStorage); use the CSV/JSON export buttons.
   For multi-reviewer persistence, add a database (e.g., Vercel Postgres/KV) behind `useGroundTruth`.

## Output schema (`dataset_results.json`)
```json
{
  "metadata": { "models": {"gpt": "...", "gemini": "...", "llama": "..."}, "...": "..." },
  "results": [{
    "video_id": "...", "comment_id": "...", "comment_text": "...",
    "classifications": {
      "gpt":    {"label": "ideation", "reasoning": "...", "latency_ms": 812.4, "error": null, "attempts": 1},
      "gemini": {"...": "..."}, "llama": {"...": "..."}
    },
    "is_unanimous": false,
    "agreement_type": "majority",
    "majority_label": "ideation"
  }]
}
```
