import { LABEL_META } from "@/lib/labels";
import type { RiskLabel } from "@/lib/types";

interface LabelBadgeProps {
  label: RiskLabel | null;
}

export default function LabelBadge({ label }: LabelBadgeProps) {
  if (!label) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
        No answer
      </span>
    );
  }
  const meta = LABEL_META[label];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
    >
      {meta.title}
    </span>
  );
}
