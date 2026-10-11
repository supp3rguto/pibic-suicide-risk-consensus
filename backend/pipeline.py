from __future__ import annotations

import argparse
import json
import logging
import os
import random
import re
import shutil
import statistics
import sys
import time
from abc import ABC, abstractmethod
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


LABELS: tuple[str, ...] = ("indicator", "ideation", "behavior", "attempt")
MODEL_KEYS: tuple[str, ...] = ("gpt", "gemini", "llama")

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"
DEFAULT_OLLAMA_MODEL = "llama3.2"

BASE_DIR = Path(__file__).resolve().parent

log = logging.getLogger("pipeline")


SYSTEM_PROMPT = """\
You are an annotation assistant for an academic research project on \
suicide-risk detection in public social-media comments. Your output is \
reviewed by a licensed psychologist; you never interact with the comment's author.

Classify the comment into EXACTLY ONE of these four severity levels:

- indicator : Indirect warning signs or risk factors WITHOUT an explicit \
statement about wanting to die (e.g., hopelessness, feeling like a burden, \
emptiness, social withdrawal, severe emotional pain).
- ideation  : Explicit thoughts or wishes about dying or killing oneself \
(passive or active), with no plan, preparation or action described.
- behavior  : Concrete planning or preparatory/self-harm behavior \
(e.g., a plan, setting a time, writing goodbye notes, giving belongings away, \
acquiring means, rehearsing, self-injury).
- attempt   : A report of an actual suicide attempt (past or in progress).

Rules:
1. Always choose exactly one level, the highest severity that the text supports.
2. Use only the text of the comment; do not assume facts that are not written.
3. Comments may be in any language. Write your reasoning in English.
4. Answer ONLY with a JSON object: \
{"label": "<indicator|ideation|behavior|attempt>", "reasoning": "<1-2 sentences>"}
"""

USER_TEMPLATE_HEAD = "Classify the following YouTube comment.\n\n<comment>\n"
USER_TEMPLATE_TAIL = (
    '\n</comment>\n\nRespond ONLY with JSON: {"label": "...", "reasoning": "..."}'
)


def build_user_prompt(comment: str) -> str:
    return f"{USER_TEMPLATE_HEAD}{comment}{USER_TEMPLATE_TAIL}"




@dataclass
class ModelVote:
    """Result of one model for one comment."""

    label: Optional[str]
    reasoning: Optional[str]
    latency_ms: float
    error: Optional[str] = None
    attempts: int = 1



_JSON_BLOCK = re.compile(r"\{.*\}", re.DOTALL)


def parse_model_output(raw: Optional[str]) -> tuple[str, str]:
    """Parse the model answer into (label, reasoning). Raises ValueError."""
    if raw is None or not raw.strip():
        raise ValueError("empty response")
    text = raw.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        match = _JSON_BLOCK.search(text)
        if not match:
            raise ValueError(f"no JSON object found in: {text[:80]!r}")
        data = json.loads(match.group(0))
    if not isinstance(data, dict):
        raise ValueError("JSON root is not an object")
    label = str(data.get("label", "")).strip().lower()
    if label not in LABELS:
        raise ValueError(f"invalid label: {label!r}")
    reasoning = str(data.get("reasoning", "")).strip()
    return label, reasoning




class BaseClassifier(ABC):
    """Common retry + latency logic. Subclasses only implement `_complete`."""

    key: str = ""

    def __init__(self, model_id: str, max_retries: int = 4) -> None:
        self.model_id = model_id
        self.max_retries = max_retries

    @abstractmethod
    def _complete(self, comment: str) -> str:
        """Call the model and return the raw text answer."""

    def warm_up(self) -> None:
        """One untimed call so cold-start/model-loading does not bias latency."""
        try:
            self._complete("This is a warm-up comment.")
        except Exception as exc:  # noqa: BLE001
            log.warning("[%s] warm-up failed: %s", self.key, exc)

    def classify(self, comment: str) -> ModelVote:
        """
        Classify one comment. Latency is the wall-clock time (perf_counter) of
        the single API call that produced the answer; back-off sleeps between
        retries are NOT included.
        """
        last_error = "unknown error"
        last_latency_ms = 0.0
        for attempt in range(1, self.max_retries + 1):
            start = time.perf_counter()
            try:
                raw = self._complete(comment)
                latency_ms = (time.perf_counter() - start) * 1000
                last_latency_ms = latency_ms
                label, reasoning = parse_model_output(raw)
                return ModelVote(label, reasoning, round(latency_ms, 2), None, attempt)
            except Exception as exc:  # noqa: BLE001
                last_latency_ms = (time.perf_counter() - start) * 1000
                last_error = f"{type(exc).__name__}: {exc}"
                log.warning(
                    "[%s] attempt %d/%d failed: %s",
                    self.key, attempt, self.max_retries, last_error,
                )
                if attempt < self.max_retries:
                    time.sleep(min(30.0, 2 ** attempt + random.random()))
        return ModelVote(None, None, round(last_latency_ms, 2), last_error, self.max_retries)


class OpenAIClassifier(BaseClassifier):
    key = "gpt"

    def __init__(self, model_id: str) -> None:
        super().__init__(model_id)
        from openai import OpenAI  # imported lazily

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        self.client = OpenAI(api_key=api_key)

    def _complete(self, comment: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model_id,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(comment)},
            ],
        )
        return response.choices[0].message.content or ""


class GeminiClassifier(BaseClassifier):
    key = "gemini"

    def __init__(self, model_id: str) -> None:
        super().__init__(model_id)
        from google import genai  # imported lazily
        from google.genai import types

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        self._types = types
        self.client = genai.Client(api_key=api_key)

        # Research content about self-harm can trip the default safety filters.
        # We relax them so the model can *classify* (not generate) such text.
        # If a response is still blocked it is recorded as an error, not hidden.
        categories = (
            "HARM_CATEGORY_HARASSMENT",
            "HARM_CATEGORY_HATE_SPEECH",
            "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "HARM_CATEGORY_DANGEROUS_CONTENT",
        )
        self._config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0,
            response_mime_type="application/json",
            safety_settings=[
                types.SafetySetting(category=c, threshold="BLOCK_NONE") for c in categories
            ],
        )

    def _complete(self, comment: str) -> str:
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=build_user_prompt(comment),
            config=self._config,
        )
        text = response.text
        if not text:
            raise ValueError("empty or blocked response from Gemini")
        return text


class OllamaClassifier(BaseClassifier):
    key = "llama"

    def __init__(self, model_id: str) -> None:
        super().__init__(model_id)
        import ollama  # imported lazily

        self.client = ollama.Client(host=os.getenv("OLLAMA_HOST", "http://localhost:11434"))
        try:
            installed = {m.get("model", m.get("name", "")) for m in self.client.list()["models"]}
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(
                f"Cannot reach Ollama ({exc}). Start it with `ollama serve`."
            ) from exc
        wanted = self.model_id if ":" in self.model_id else f"{self.model_id}:latest"
        if wanted not in installed:
            raise RuntimeError(f"Model '{self.model_id}' not found. Run: ollama pull {self.model_id}")

    def _complete(self, comment: str) -> str:
        response = self.client.chat(
            model=self.model_id,
            format="json",
            options={"temperature": 0},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(comment)},
            ],
        )
        return response["message"]["content"]


def build_classifiers() -> dict[str, BaseClassifier]:
    return {
        "gpt": OpenAIClassifier(os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)),
        "gemini": GeminiClassifier(os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)),
        "llama": OllamaClassifier(os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)),
    }



def compute_consensus(votes: dict[str, ModelVote]) -> dict[str, Any]:
    """
    is_unanimous    : True only if all three models returned a valid label AND
                      the three labels are identical.
    agreement_type  : unanimous | majority (2 of 3) | full_disagreement | incomplete
                      (incomplete = at least one model failed to answer).
    majority_label  : label chosen by >= 2 models (informational only).
    """
    valid = [v.label for v in votes.values() if v.label]
    counts = Counter(valid)
    if len(valid) < len(votes):
        agreement_type = "incomplete"
    elif len(counts) == 1:
        agreement_type = "unanimous"
    elif counts.most_common(1)[0][1] == 2:
        agreement_type = "majority"
    else:
        agreement_type = "full_disagreement"
    top_label, top_count = counts.most_common(1)[0] if counts else (None, 0)
    return {
        "is_unanimous": agreement_type == "unanimous",
        "agreement_type": agreement_type,
        "majority_label": top_label if top_count >= 2 else None,
    }



_VIDEO_ID = re.compile(r"(?:v=|youtu\.be/|shorts/|embed/)([A-Za-z0-9_-]{11})")


def extract_video_id(value: str) -> str:
    value = value.strip()
    match = _VIDEO_ID.search(value)
    if match:
        return match.group(1)
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value
    raise ValueError(f"Cannot extract a YouTube video ID from: {value!r}")


def load_video_ids(cli_values: Optional[list[str]], videos_file: Path, expected: int) -> list[str]:
    raw: list[str] = []
    if cli_values:
        raw = cli_values
    elif os.getenv("YOUTUBE_VIDEO_IDS"):
        raw = os.environ["YOUTUBE_VIDEO_IDS"].split(",")
    elif videos_file.exists():
        raw = [
            line.strip()
            for line in videos_file.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.startswith("#")
        ]
    ids = list(dict.fromkeys(extract_video_id(v) for v in raw if v.strip()))
    if len(ids) != expected:
        raise SystemExit(
            f"Expected exactly {expected} distinct videos, got {len(ids)}. "
            f"Use --videos, YOUTUBE_VIDEO_IDS or {videos_file.name}."
        )
    return ids


def fetch_comments(youtube: Any, video_id: str, count: int, order: str) -> list[dict[str, str]]:
    from googleapiclient.errors import HttpError  # imported lazily

    comments: list[dict[str, str]] = []
    seen: set[str] = set()
    page_token: Optional[str] = None
    while len(comments) < count:
        try:
            response = (
                youtube.commentThreads()
                .list(
                    part="snippet",
                    videoId=video_id,
                    maxResults=min(100, count),
                    order=order,
                    textFormat="plainText",
                    pageToken=page_token,
                )
                .execute()
            )
        except HttpError as exc:
            raise RuntimeError(
                f"YouTube API error for video {video_id} "
                f"(comments disabled, quota exceeded or invalid ID?): {exc}"
            ) from exc
        for item in response.get("items", []):
            top = item["snippet"]["topLevelComment"]
            comment_id = top["id"]
            text = (top["snippet"].get("textDisplay") or "").strip()
            if not text or comment_id in seen:
                continue
            seen.add(comment_id)
            # Author name / channel ID are deliberately not stored (privacy).
            comments.append({"video_id": video_id, "comment_id": comment_id, "comment_text": text})
            if len(comments) == count:
                break
        page_token = response.get("nextPageToken")
        if not page_token:
            break
    return comments


def collect_comments(
    video_ids: list[str], per_video: int, order: str, cache: Path, refresh: bool, allow_fewer: bool
) -> list[dict[str, str]]:
    if cache.exists() and not refresh:
        data = json.loads(cache.read_text(encoding="utf-8"))
        cached_ids = list(dict.fromkeys(c["video_id"] for c in data))
        if cached_ids == video_ids:
            log.info("Using cached comments from %s (%d comments)", cache.name, len(data))
            return data
        log.info("Cache does not match requested videos; fetching again.")

    from googleapiclient.discovery import build  # imported lazily

    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise SystemExit("YOUTUBE_API_KEY is not set")
    youtube = build("youtube", "v3", developerKey=api_key, cache_discovery=False)

    all_comments: list[dict[str, str]] = []
    for index, video_id in enumerate(video_ids, start=1):
        comments = fetch_comments(youtube, video_id, per_video, order)
        log.info("Video %d/%d (%s): %d comments", index, len(video_ids), video_id, len(comments))
        if len(comments) < per_video and not allow_fewer:
            raise SystemExit(
                f"Video {video_id} has only {len(comments)} usable comments (< {per_video}). "
                "Pick another video or pass --allow-fewer."
            )
        all_comments.extend(comments)
    cache.write_text(json.dumps(all_comments, ensure_ascii=False, indent=2), encoding="utf-8")
    return all_comments



def build_record(comment: dict[str, str], votes: dict[str, ModelVote]) -> dict[str, Any]:
    return {
        "video_id": comment["video_id"],
        "comment_id": comment["comment_id"],
        "comment_text": comment["comment_text"],
        "classifications": {key: asdict(vote) for key, vote in votes.items()},
        **compute_consensus(votes),
    }


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def has_error(record: dict[str, Any]) -> bool:
    return any(c.get("error") for c in record["classifications"].values())


def classify_comments(
    comments: list[dict[str, str]],
    classifiers: dict[str, BaseClassifier],
    output: Path,
    metadata: dict[str, Any],
    sleep_s: float = 0.0,
) -> list[dict[str, Any]]:
    existing: dict[str, dict[str, Any]] = {}
    if output.exists():
        try:
            previous = json.loads(output.read_text(encoding="utf-8"))
            existing = {r["comment_id"]: r for r in previous.get("results", []) if not has_error(r)}
            if existing:
                log.info("Resuming: %d comments already classified.", len(existing))
        except (json.JSONDecodeError, KeyError):
            log.warning("Could not read previous output; starting fresh.")

    results: list[dict[str, Any]] = []
    total = len(comments)
    for index, comment in enumerate(comments, start=1):
        if comment["comment_id"] in existing:
            results.append(existing[comment["comment_id"]])
            continue

        # Sequential on purpose: running models in parallel would let them
        # compete for CPU/network and distort the latency measurements.
        votes = {key: clf.classify(comment["comment_text"]) for key, clf in classifiers.items()}
        record = build_record(comment, votes)
        results.append(record)

        summary = " | ".join(
            f"{k}={v.label or 'ERR'} ({v.latency_ms:.0f} ms)" for k, v in votes.items()
        )
        log.info("[%d/%d] %s -> %s", index, total, summary, record["agreement_type"])

        write_json_atomic(output, {"metadata": metadata, "results": results})
        if sleep_s:
            time.sleep(sleep_s)

    write_json_atomic(output, {"metadata": metadata, "results": results})
    return results


def print_summary(results: list[dict[str, Any]]) -> None:
    if not results:
        return
    unanimous = sum(r["is_unanimous"] for r in results)
    log.info("=" * 60)
    log.info("Comments: %d | Unanimous: %d (%.1f%%) | Disagreement: %d",
             len(results), unanimous, 100 * unanimous / len(results), len(results) - unanimous)
    for key in MODEL_KEYS:
        times = [r["classifications"][key]["latency_ms"] for r in results
                 if not r["classifications"][key]["error"]]
        if times:
            log.info("Latency %-6s mean=%.0f ms | median=%.0f ms",
                     key, statistics.mean(times), statistics.median(times))
    log.info("=" * 60)



def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Tri-Model Consensus pipeline (PIBIC).")
    p.add_argument("--videos", nargs="*", help="YouTube video IDs or URLs (exactly --n-videos).")
    p.add_argument("--videos-file", type=Path, default=BASE_DIR / "videos.txt")
    p.add_argument("--n-videos", type=int, default=5)
    p.add_argument("--comments-per-video", type=int, default=50)
    p.add_argument("--order", choices=["relevance", "time"], default="relevance",
                   help="YouTube comment ordering (default: relevance).")
    p.add_argument("--allow-fewer", action="store_true",
                   help="Do not abort if a video has fewer comments than requested.")
    p.add_argument("--refresh-comments", action="store_true", help="Ignore comments_raw.json cache.")
    p.add_argument("--raw-comments", type=Path, default=BASE_DIR / "comments_raw.json")
    p.add_argument("--output", type=Path, default=BASE_DIR / "dataset_results.json")
    p.add_argument("--sync-frontend", action="store_true",
                   help="Copy the result to ../frontend/data/dataset_results.json.")
    p.add_argument("--sleep", type=float, default=0.0, help="Seconds to wait between comments.")
    p.add_argument("--skip-warmup", action="store_true")
    return p.parse_args()


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-7s %(message)s",
                        datefmt="%H:%M:%S")
    try:
        from dotenv import load_dotenv

        load_dotenv(BASE_DIR / ".env")
    except ImportError:
        log.warning("python-dotenv not installed; relying on the process environment.")

    args = parse_args()
    video_ids = load_video_ids(args.videos, args.videos_file, args.n_videos)

    comments = collect_comments(video_ids, args.comments_per_video, args.order,
                                args.raw_comments, args.refresh_comments, args.allow_fewer)

    classifiers = build_classifiers()
    if not args.skip_warmup:
        log.info("Warming up models (not timed)...")
        for clf in classifiers.values():
            clf.warm_up()

    metadata = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_demo": False,
        "models": {key: clf.model_id for key, clf in classifiers.items()},
        "labels": list(LABELS),
        "video_ids": video_ids,
        "comments_per_video": args.comments_per_video,
        "total_comments": len(comments),
        "youtube_order": args.order,
        "temperature": 0,
    }

    results = classify_comments(comments, classifiers, args.output, metadata, args.sleep)
    print_summary(results)
    log.info("Saved %s", args.output)

    if args.sync_frontend:
        target = BASE_DIR.parent / "frontend" / "data" / "dataset_results.json"
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(args.output, target)
        log.info("Copied to %s", target)
    return 0


if __name__ == "__main__":
    sys.exit(main())
