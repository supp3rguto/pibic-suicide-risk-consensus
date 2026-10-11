import type { CommentRecord, GroundTruthMap } from "./types";

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const csvCell = (value: string | null | undefined): string =>
  `"${(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

export function exportGroundTruthJson(records: CommentRecord[], decisions: GroundTruthMap): void {
  const rows = records
    .filter((r) => decisions[r.comment_id])
    .map((r) => ({
      video_id: r.video_id,
      comment_id: r.comment_id,
      comment_text: r.comment_text,
      model_labels: {
        gpt: r.classifications.gpt.label,
        gemini: r.classifications.gemini.label,
        llama: r.classifications.llama.label,
      },
      ground_truth: decisions[r.comment_id].label,
      decided_at: decisions[r.comment_id].decided_at,
    }));
  download("ground_truth.json", JSON.stringify(rows, null, 2), "application/json");
}

export function exportGroundTruthCsv(records: CommentRecord[], decisions: GroundTruthMap): void {
  const header = [
    "video_id",
    "comment_id",
    "gpt",
    "gemini",
    "llama",
    "ground_truth",
    "decided_at",
    "comment_text",
  ].join(",");
  const lines = records
    .filter((r) => decisions[r.comment_id])
    .map((r) =>
      [
        csvCell(r.video_id),
        csvCell(r.comment_id),
        csvCell(r.classifications.gpt.label),
        csvCell(r.classifications.gemini.label),
        csvCell(r.classifications.llama.label),
        csvCell(decisions[r.comment_id].label),
        csvCell(decisions[r.comment_id].decided_at),
        csvCell(r.comment_text),
      ].join(","),
    );
  download("ground_truth.csv", [header, ...lines].join("\n"), "text/csv;charset=utf-8");
}
