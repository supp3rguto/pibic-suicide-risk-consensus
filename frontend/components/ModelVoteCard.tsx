import { Timer, AlertTriangle } from "lucide-react";
import LabelBadge from "./LabelBadge";
import { MODEL_META } from "@/lib/labels";
import type { ModelClassification, ModelKey } from "@/lib/types";

interface ModelVoteCardProps {
  model: ModelKey;
  modelId: string;
  vote: ModelClassification;
}

export default function ModelVoteCard({ model, modelId, vote }: ModelVoteCardProps) {
  const meta = MODEL_META[model];

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
            <h4 className="truncate text-sm font-semibold text-slate-900">{meta.name}</h4>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">{modelId}</p>
        </div>
        <LabelBadge label={vote.label} />
      </header>

      <div className="mt-3 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reasoning</p>
        {vote.error ? (
          <p className="mt-1 flex items-start gap-1.5 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{vote.error}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{vote.reasoning || "No reasoning provided."}</p>
        )}
      </div>

      <footer className="mt-3 flex items-center gap-1.5 border-t border-slate-200 pt-2 text-xs text-slate-500">
        <Timer className="h-3.5 w-3.5" aria-hidden />
        <span className="tabular-nums">{Math.round(vote.latency_ms).toLocaleString("en-US")} ms</span>
      </footer>
    </article>
  );
}
