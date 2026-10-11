"use client";

import { useCallback, useEffect, useState } from "react";
import type { GroundTruthMap, RiskLabel } from "./types";

const STORAGE_KEY = "pibic.ground_truth.v1";

/**
 * Stores the psychologist's decisions in the browser (localStorage).
 * Vercel serverless has no persistent disk, so use the Export buttons to
 * save the final ground truth, or plug a database in `persist` later.
 */
export function useGroundTruth() {
  const [decisions, setDecisions] = useState<GroundTruthMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setDecisions(JSON.parse(stored) as GroundTruthMap);
    } catch {
      /* corrupted storage: start empty */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
    } catch {
      /* storage full / unavailable */
    }
  }, [decisions, hydrated]);

  /** Click a label to set it; click the same label again to undo. */
  const decide = useCallback((commentId: string, label: RiskLabel) => {
    setDecisions((prev) => {
      const next = { ...prev };
      if (next[commentId]?.label === label) {
        delete next[commentId];
      } else {
        next[commentId] = { label, decided_at: new Date().toISOString() };
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setDecisions({}), []);

  return { decisions, hydrated, decide, clearAll };
}
