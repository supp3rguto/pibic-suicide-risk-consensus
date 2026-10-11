import raw from "@/data/dataset_results.json";
import type { DatasetFile } from "./types";

/** Reads the JSON produced by backend/pipeline.py (bundled at build time). */
export function loadDataset(): DatasetFile {
  return raw as unknown as DatasetFile;
}
