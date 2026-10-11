"use client";

import { useMemo, useState } from "react";
import { 
  CheckCircle2, Download, Info, Trash2, Filter, ActivitySquare, 
  FileText, X, Printer, BrainCircuit 
} from "lucide-react";
import ModelVoteCard from "./ModelVoteCard";
import { LABEL_META } from "@/lib/labels";
import { exportGroundTruthCsv, exportGroundTruthJson } from "@/lib/export";
import { useGroundTruth } from "@/lib/useGroundTruth";
import { MODEL_KEYS, RISK_LABELS, type CommentRecord, type DatasetMetadata, type RiskLabel } from "@/lib/types";

type StatusFilter = "all" | "pending" | "reviewed";
type DatasetMode = "disagreements" | "unanimous";

interface ArbitrationPanelProps {
  records: CommentRecord[];
  metadata: DatasetMetadata;
}

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "all", label: "All" },
];

export default function ArbitrationPanel({ records, metadata }: ArbitrationPanelProps) {
  const { decisions, hydrated, decide, clearAll } = useGroundTruth();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [selectedVideo, setSelectedVideo] = useState<string>("all");
  const [datasetMode, setDatasetMode] = useState<DatasetMode>("disagreements");
  
  const [showReport, setShowReport] = useState(false);

  const targetRecords = useMemo(() => {
    return records.filter((r) => datasetMode === "unanimous" ? r.is_unanimous : !r.is_unanimous);
  }, [records, datasetMode]);

  const videoIndex = useMemo(
    () => new Map(metadata.video_ids.map((id, index) => [id, index + 1] as const)),
    [metadata.video_ids],
  );

  const reviewedCount = targetRecords.filter((r) => decisions[r.comment_id]).length;
  const progress = targetRecords.length ? reviewedCount / targetRecords.length : 0;

  const humanStats = useMemo(() => {
    const stats: Record<RiskLabel, number> = { indicator: 0, ideation: 0, behavior: 0, attempt: 0 };
    let totalReviewed = 0;
    let gptCorrect = 0;
    let geminiCorrect = 0;
    let llamaCorrect = 0;

    Object.entries(decisions).forEach(([commentId, decision]) => {
      if (stats[decision.label] !== undefined) {
        stats[decision.label]++;
        totalReviewed++;

        const record = records.find(r => r.comment_id === commentId);
        if (record) {
          if (record.classifications.gpt.label === decision.label) gptCorrect++;
          if (record.classifications.gemini.label === decision.label) geminiCorrect++;
          if (record.classifications.llama.label === decision.label) llamaCorrect++;
        }
      }
    });

    return { 
      stats, 
      totalReviewed,
      accuracy: {
        gpt: totalReviewed > 0 ? (gptCorrect / totalReviewed) * 100 : 0,
        gemini: totalReviewed > 0 ? (geminiCorrect / totalReviewed) * 100 : 0,
        llama: totalReviewed > 0 ? (llamaCorrect / totalReviewed) * 100 : 0,
      }
    };
  }, [decisions, records]);

  const visible = targetRecords.filter((r) => {
    if (selectedVideo !== "all" && r.video_id !== selectedVideo) return false;
    const reviewed = Boolean(decisions[r.comment_id]);
    if (filter === "pending") return !reviewed;
    if (filter === "reviewed") return reviewed;
    return true;
  });

  const handleClear = () => {
    if (window.confirm("Remove all ground-truth decisions stored in this browser?")) clearAll();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & BUTTONS (MOBILE RESPONSIVE) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Arbitration Panel</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Human-in-the-loop review. Your choices become the clinical ground truth.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => setShowReport(true)}
            disabled={humanStats.totalReviewed === 0}
            className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600 sm:col-span-1 sm:w-auto"
          >
            <FileText className="h-4 w-4" aria-hidden /> Generate Report
          </button>
          
          <button
            type="button"
            onClick={() => exportGroundTruthCsv(records, decisions)}
            disabled={humanStats.totalReviewed === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
          >
            <Download className="h-4 w-4" aria-hidden /> CSV
          </button>
          <button
            type="button"
            onClick={() => exportGroundTruthJson(records, decisions)}
            disabled={humanStats.totalReviewed === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 sm:w-auto"
          >
            <Download className="h-4 w-4" aria-hidden /> JSON
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={humanStats.totalReviewed === 0}
            className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:col-span-1 sm:w-auto"
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Reset
          </button>
        </div>
      </div>

      {hydrated && humanStats.totalReviewed > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <div className="mb-4 flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <ActivitySquare className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Clinical Ground Truth</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {RISK_LABELS.map((label) => (
              <div key={label} className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900 sm:p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{LABEL_META[label].title}</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{humanStats.stats[label]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>This page contains sensitive content. Decisions are saved only in this browser.</p>
      </div>

      {/* FILTER SECTION (MOBILE RESPONSIVE) */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex w-full flex-row gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <button
            onClick={() => setDatasetMode("disagreements")}
            className={`flex-1 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              datasetMode === "disagreements" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            Disagreements ({records.filter(r => !r.is_unanimous).length})
          </button>
          <button
            onClick={() => setDatasetMode("unanimous")}
            className={`flex-1 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              datasetMode === "unanimous" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            Unanimous ({records.filter(r => r.is_unanimous).length})
          </button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center sm:text-left">
              {hydrated ? reviewedCount : 0} of {targetRecords.length} reviewed
              <span className="ml-2 text-slate-400">({(progress * 100).toFixed(0)}%)</span>
            </p>
            
            <div className="flex w-full items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-4 dark:border-slate-700">
              <Filter className="h-4 w-4 shrink-0 text-slate-400" />
              <select
                value={selectedVideo}
                onChange={(e) => setSelectedVideo(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-auto sm:py-1.5"
              >
                <option value="all">All Videos</option>
                {metadata.video_ids.map((id, idx) => (
                  <option key={id} value={id}>Video {idx + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex w-full rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800 lg:w-auto" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-1 rounded px-3 py-2 text-xs sm:text-sm font-medium transition-colors lg:flex-none lg:py-1.5 ${
                  filter === f.value 
                  ? "bg-white text-blue-800 shadow-sm dark:bg-slate-900 dark:text-blue-400" 
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </section>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No comments match the current filters.
        </div>
      ) : (
        <ul className="space-y-5">
          {visible.map((record) => {
            const decision = decisions[record.comment_id];
            return (
              <li
                key={record.comment_id}
                className={`rounded-xl border bg-white p-4 sm:p-5 shadow-sm dark:bg-slate-900 ${
                  decision ? "border-blue-300 dark:border-blue-800" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Video {videoIndex.get(record.video_id) ?? "?"}
                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
                    <span className="font-mono">{record.comment_id}</span>
                  </span>
                  {decision ? (
                    <span className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-400">
                      <CheckCircle2 className="h-4 w-4" aria-hidden /> Reviewed
                    </span>
                  ) : (
                    <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>
                  )}
                </div>
                <blockquote className="mt-3 whitespace-pre-line rounded-lg border-l-4 border-blue-600 bg-slate-50 px-3 py-3 text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:border-blue-500 dark:bg-slate-800/50 dark:text-slate-200 sm:px-4">
                  {record.comment_text}
                </blockquote>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {MODEL_KEYS.map((model) => (
                    <ModelVoteCard
                      key={model}
                      model={model}
                      modelId={metadata.models[model]}
                      vote={record.classifications[model]}
                    />
                  ))}
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-center sm:text-left dark:text-slate-400">
                    Ground truth (psychologist decision)
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {RISK_LABELS.map((label) => {
                      const meta = LABEL_META[label];
                      const active = decision?.label === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          title={meta.description}
                          aria-pressed={active}
                          onClick={() => decide(record.comment_id, label)}
                          className={`rounded-md border px-2 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                            active ? meta.buttonActive : `bg-white dark:bg-slate-900 dark:hover:bg-slate-800 ${meta.buttonIdle}`
                          }`}
                        >
                          {meta.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* FINAL CLINICAL REPORT MODAL */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:p-10">
            <button 
              onClick={() => setShowReport(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 sm:right-6 sm:top-6"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6 sm:mb-8 text-center pt-4 sm:pt-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Final Clinical Report</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                PIBIC Research • Ground Truth Analysis • {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-6">
                <h3 className="mb-4 flex items-center gap-2 text-base sm:text-lg font-bold text-emerald-800 dark:text-emerald-400">
                  <ActivitySquare className="h-5 w-5" /> Human Ground Truth
                </h3>
                <p className="mb-4 text-xs sm:text-sm text-emerald-700 dark:text-emerald-500">
                  Based on {humanStats.totalReviewed} manually arbitrated comments.
                </p>
                <div className="space-y-3">
                  {RISK_LABELS.map(label => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
                      <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">{LABEL_META[label].title}</span>
                      <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{humanStats.stats[label]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 sm:p-6">
                <h3 className="mb-4 flex items-center gap-2 text-base sm:text-lg font-bold text-blue-800 dark:text-blue-400">
                  <BrainCircuit className="h-5 w-5" /> AI Model Accuracy
                </h3>
                <p className="mb-4 text-xs sm:text-sm text-blue-700 dark:text-blue-500">
                  Percentage of agreement with the Psychologist's decisions.
                </p>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">GPT-4o-mini</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">{humanStats.accuracy.gpt.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${humanStats.accuracy.gpt}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Gemini 1.5 Flash</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">{humanStats.accuracy.gemini.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${humanStats.accuracy.gemini}%` }}></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Llama 3.2 (Local)</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">{humanStats.accuracy.llama.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${humanStats.accuracy.llama}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center border-t border-slate-200 pt-6 dark:border-slate-800">
              <button 
                onClick={() => window.print()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 sm:w-auto"
              >
                <Printer className="h-5 w-5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}