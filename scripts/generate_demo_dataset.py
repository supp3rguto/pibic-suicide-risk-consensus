#!/usr/bin/env python3
"""
Generates a SYNTHETIC demo dataset (frontend/data/dataset_results.json) so the
dashboard can be previewed before the real pipeline has run.
It contains NO real YouTube data. The real pipeline overwrites this file.

Usage: python scripts/generate_demo_dataset.py
"""
import json
import random
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SEED = 42
LABELS = ["indicator", "ideation", "behavior", "attempt"]
VIDEOS = ["DEMO_VID_001", "DEMO_VID_002", "DEMO_VID_003", "DEMO_VID_004", "DEMO_VID_005"]
PER_VIDEO = 10

# (text, "plausible" label). Deliberately mild, synthetic, demo-only phrases.
SAMPLES = [
    ("I feel so empty lately, nothing seems to matter anymore.", "indicator"),
    ("I'm so tired of pretending I'm okay all the time.", "indicator"),
    ("I haven't slept properly in weeks and I feel like a burden to everyone.", "indicator"),
    ("Everyone would be better off without me around.", "ideation"),
    ("Sometimes I wish I could just go to sleep and not wake up.", "ideation"),
    ("I keep thinking about ending it all.", "ideation"),
    ("I wrote letters to my family last night, just in case.", "behavior"),
    ("I gave away most of my things this week. I don't think I'll need them.", "behavior"),
    ("Two years ago I tried to end my life. I'm still here and it does get better.", "attempt"),
    ("I survived an attempt last month, still fighting every single day.", "attempt"),
    ("My friend told me she is thinking about hurting herself. How can I help her?", "indicator"),
    ("This song hits different when you're hurting inside.", "indicator"),
]

# Probability that each model deviates by one severity level from the "plausible" label.
NOISE = {"gpt": 0.08, "gemini": 0.12, "llama": 0.22}
LATENCY = {"gpt": (550, 1300), "gemini": (450, 1500), "llama": (1800, 6500)}
MODEL_IDS = {"gpt": "gpt-4o-mini", "gemini": "gemini-3.5-flash-lite", "llama": "llama3.2:latest"}

REASONING = {
    "indicator": "Expresses distress or hopelessness without an explicit wish to die.",
    "ideation": "Contains an explicit or passive wish to die, with no plan or action described.",
    "behavior": "Describes preparatory behavior consistent with planning or self-harm.",
    "attempt": "Reports an actual suicide attempt by the author.",
}


def noisy(label: str, p: float, rng: random.Random) -> str:
    if rng.random() >= p:
        return label
    i = LABELS.index(label)
    options = [j for j in (i - 1, i + 1) if 0 <= j < len(LABELS)]
    return LABELS[rng.choice(options)]


def main() -> None:
    rng = random.Random(SEED)
    results = []
    for v_index, video_id in enumerate(VIDEOS):
        for c_index in range(PER_VIDEO):
            text, base = SAMPLES[(v_index * 5 + c_index) % len(SAMPLES)]
            cls = {}
            for key in ("gpt", "gemini", "llama"):
                label = noisy(base, NOISE[key], rng)
                lo, hi = LATENCY[key]
                cls[key] = {
                    "label": label,
                    "reasoning": f"[DEMO] {REASONING[label]}",
                    "latency_ms": round(rng.uniform(lo, hi), 2),
                    "error": None,
                    "attempts": 1,
                }
            counts = Counter(c["label"] for c in cls.values())
            top, n = counts.most_common(1)[0]
            kind = "unanimous" if len(counts) == 1 else ("majority" if n == 2 else "full_disagreement")
            results.append({
                "video_id": video_id,
                "comment_id": f"demo_{v_index + 1}_{c_index + 1:02d}",
                "comment_text": text,
                "classifications": cls,
                "is_unanimous": kind == "unanimous",
                "agreement_type": kind,
                "majority_label": top if n >= 2 else None,
            })
    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "is_demo": True,
            "models": MODEL_IDS,
            "labels": LABELS,
            "video_ids": VIDEOS,
            "comments_per_video": PER_VIDEO,
            "total_comments": len(results),
            "youtube_order": "relevance",
            "temperature": 0,
        },
        "results": results,
    }
    out = Path(__file__).resolve().parent.parent / "frontend" / "data" / "dataset_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    dis = sum(not r["is_unanimous"] for r in results)
    print(f"Wrote {out} ({len(results)} records, {dis} disagreements)")


if __name__ == "__main__":
    main()
