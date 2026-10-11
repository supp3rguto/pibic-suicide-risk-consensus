import { FlaskConical } from "lucide-react";

export default function DemoBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <strong>Demo data.</strong> You are seeing a synthetic dataset. Run <code>backend/pipeline.py</code> with{" "}
        <code>--sync-frontend</code> to replace it with your real results.
      </p>
    </div>
  );
}
