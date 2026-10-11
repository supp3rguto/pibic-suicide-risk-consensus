import type { ModelKey, RiskLabel } from "./types";

export interface LabelMeta {
  title: string;
  description: string;
  badge: string;
  buttonIdle: string;
  buttonActive: string;
}

export const LABEL_META: Record<RiskLabel, LabelMeta> = {
  indicator: {
    title: "Indicator",
    description: "Indirect warning signs, no explicit wish to die.",
    badge: "bg-sky-50 text-sky-800 ring-sky-200",
    buttonIdle: "border-sky-200 text-sky-800 hover:bg-sky-50",
    buttonActive: "border-sky-600 bg-sky-600 text-white",
  },
  ideation: {
    title: "Ideation",
    description: "Explicit thoughts about dying, no plan or action.",
    badge: "bg-blue-50 text-blue-800 ring-blue-200",
    buttonIdle: "border-blue-200 text-blue-800 hover:bg-blue-50",
    buttonActive: "border-blue-700 bg-blue-700 text-white",
  },
  behavior: {
    title: "Behavior",
    description: "Planning, preparatory acts or self-harm behavior.",
    badge: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    buttonIdle: "border-indigo-200 text-indigo-800 hover:bg-indigo-50",
    buttonActive: "border-indigo-700 bg-indigo-700 text-white",
  },
  attempt: {
    title: "Attempt",
    description: "Reports an actual suicide attempt.",
    badge: "bg-rose-50 text-rose-800 ring-rose-200",
    buttonIdle: "border-rose-200 text-rose-800 hover:bg-rose-50",
    buttonActive: "border-rose-700 bg-rose-700 text-white",
  },
};

export interface ModelMeta {
  name: string;
  vendor: string;
  color: string;
}

export const MODEL_META: Record<ModelKey, ModelMeta> = {
  gpt: { name: "GPT-4o-mini", vendor: "OpenAI API", color: "#1d4ed8" },
  gemini: { name: "Gemini Flash", vendor: "Google GenAI API", color: "#0ea5e9" },
  llama: { name: "Llama 3.2", vendor: "Ollama (local)", color: "#64748b" },
};

export const CHART_COLORS = {
  unanimous: "#2563eb",
  disagreement: "#f59e0b",
  grid: "#e2e8f0",
  axis: "#64748b",
} as const;
