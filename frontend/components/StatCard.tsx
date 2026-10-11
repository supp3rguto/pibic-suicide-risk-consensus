import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  icon: ReactNode;
}

export default function StatCard({ title, value, hint, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="rounded-md bg-blue-50 p-2 text-blue-700">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
