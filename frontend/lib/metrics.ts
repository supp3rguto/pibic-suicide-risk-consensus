import { MODEL_KEYS, type AgreementType, type CommentRecord, type ModelKey } from "./types";

export interface VideoStat {
  videoId: string;
  label: string;
  total: number;
  unanimous: number;
  disagreement: number;
  agreementRate: number;
}

export interface LatencyStat {
  model: ModelKey;
  meanMs: number;
  medianMs: number;
  p95Ms: number;
  samples: number;
}

export interface DatasetMetrics {
  total: number;
  unanimous: number;
  disagreement: number;
  agreementRate: number;
  byAgreementType: Record<AgreementType, number>;
  byVideo: VideoStat[];
  latency: LatencyStat[];
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function computeMetrics(records: CommentRecord[]): DatasetMetrics {
  const total = records.length;
  const unanimous = records.filter((r) => r.is_unanimous).length;

  const byAgreementType: Record<AgreementType, number> = {
    unanimous: 0,
    majority: 0,
    full_disagreement: 0,
    incomplete: 0,
  };
  records.forEach((r) => {
    byAgreementType[r.agreement_type] += 1;
  });

  const videoIds = Array.from(new Set(records.map((r) => r.video_id)));
  const byVideo: VideoStat[] = videoIds.map((videoId, index) => {
    const rows = records.filter((r) => r.video_id === videoId);
    const u = rows.filter((r) => r.is_unanimous).length;
    return {
      videoId,
      label: `Video ${index + 1}`,
      total: rows.length,
      unanimous: u,
      disagreement: rows.length - u,
      agreementRate: rows.length ? u / rows.length : 0,
    };
  });

  const latency: LatencyStat[] = MODEL_KEYS.map((model) => {
    const values = records
      .filter((r) => !r.classifications[model].error)
      .map((r) => r.classifications[model].latency_ms)
      .sort((a, b) => a - b);
    return {
      model,
      meanMs: mean(values),
      medianMs: percentile(values, 50),
      p95Ms: percentile(values, 95),
      samples: values.length,
    };
  });

  return {
    total,
    unanimous,
    disagreement: total - unanimous,
    agreementRate: total ? unanimous / total : 0,
    byAgreementType,
    byVideo,
    latency,
  };
}

export const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;
export const formatMs = (value: number): string => `${Math.round(value).toLocaleString("en-US")} ms`;
