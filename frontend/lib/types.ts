export const RISK_LABELS = ["indicator", "ideation", "behavior", "attempt"] as const;
export type RiskLabel = (typeof RISK_LABELS)[number];

export const MODEL_KEYS = ["gpt", "gemini", "llama"] as const;
export type ModelKey = (typeof MODEL_KEYS)[number];

export type AgreementType = "unanimous" | "majority" | "full_disagreement" | "incomplete";

export interface ModelClassification {
  label: RiskLabel | null;
  reasoning: string | null;
  latency_ms: number;
  error: string | null;
  attempts?: number;
}

export interface CommentRecord {
  video_id: string;
  comment_id: string;
  comment_text: string;
  classifications: Record<ModelKey, ModelClassification>;
  is_unanimous: boolean;
  agreement_type: AgreementType;
  majority_label: RiskLabel | null;
}

export interface DatasetMetadata {
  generated_at: string;
  is_demo: boolean;
  models: Record<ModelKey, string>;
  labels: RiskLabel[];
  video_ids: string[];
  comments_per_video: number;
  total_comments: number;
  youtube_order: string;
  temperature: number;
}

export interface DatasetFile {
  metadata: DatasetMetadata;
  results: CommentRecord[];
}

export interface GroundTruthEntry {
  label: RiskLabel;
  decided_at: string;
}

export type GroundTruthMap = Record<string, GroundTruthEntry>;
