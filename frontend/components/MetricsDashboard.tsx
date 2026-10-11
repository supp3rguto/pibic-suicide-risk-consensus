"use client";

import { useMemo, type ReactNode } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Gauge, MessageSquareText, ExternalLink, PlaySquare } from "lucide-react";
import StatCard from "./StatCard";
import { CHART_COLORS, MODEL_META } from "@/lib/labels";
import { computeMetrics, formatMs, formatPercent } from "@/lib/metrics";
import type { DatasetMetadata, CommentRecord } from "@/lib/types";

interface MetricsDashboardProps {
  records: CommentRecord[];
  metadata: DatasetMetadata;
}

function YouTubeVideoCard({ videoId, index }: { videoId: string; index: number }) {
  return (
    <a
      href={`https://youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col justify-between rounded-xl border border-blue-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md dark:border-blue-900/50 dark:bg-slate-900 dark:hover:border-blue-700"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="rounded bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Video {index}
          </span>
          <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400" />
        </div>
        <h3 className="mt-4 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
          ID: {videoId}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <PlaySquare className="h-3.5 w-3.5" />
          Click to watch on YouTube
        </p>
      </div>
    </a>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {subtitle ? <p className="mb-4 mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

export default function MetricsDashboard({ records, metadata }: MetricsDashboardProps) {
  const metrics = useMemo(() => computeMetrics(records), [records]);

  const pieData = [
    { name: "Unanimous", value: metrics.unanimous, color: CHART_COLORS.unanimous },
    { name: "Disagreement", value: metrics.disagreement, color: CHART_COLORS.disagreement },
  ];

  const videoChartData = metrics.byVideo.map((v) => ({
    name: v.label,
    Unanimous: v.unanimous,
    Disagreement: v.disagreement,
  }));

  const latencyChartData = metrics.latency.map((l) => ({
    name: MODEL_META[l.model].name,
    mean: Math.round(l.meanMs),
    color: MODEL_META[l.model].color,
  }));

  const fastest = [...metrics.latency].filter((l) => l.samples > 0).sort((a, b) => a.meanMs - b.meanMs)[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Consensus Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Agreement and latency across the three models &middot; temperature {metadata.temperature} &middot;
          generated {new Date(metadata.generated_at).toLocaleString("en-GB")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Comments analysed" value={metrics.total.toLocaleString("en-US")} hint={`${metrics.byVideo.length} videos`} icon={<MessageSquareText className="h-5 w-5" aria-hidden />} />
        <StatCard title="Unanimity rate" value={formatPercent(metrics.agreementRate)} hint={`${metrics.unanimous} comments, 3 of 3 models agree`} icon={<CheckCircle2 className="h-5 w-5" aria-hidden />} />
        <StatCard title="Disagreements" value={metrics.disagreement.toLocaleString("en-US")} hint={`${metrics.byAgreementType.majority} majority · ${metrics.byAgreementType.full_disagreement} full split`} icon={<AlertTriangle className="h-5 w-5" aria-hidden />} />
        <StatCard title="Fastest model" value={fastest ? MODEL_META[fastest.model].name : "-"} hint={fastest ? `mean ${formatMs(fastest.meanMs)} per comment` : undefined} icon={<Gauge className="h-5 w-5" aria-hidden />} />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Analyzed Video Sample
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metadata.video_ids.map((id, index) => (
            <YouTubeVideoCard key={id} videoId={id} index={index + 1} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 pt-4">
        <Panel title="Global agreement" subtitle="Unanimous vs. disagreement">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={2} stroke="none">
                  {pieData.map((slice) => <Cell key={slice.name} fill={slice.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderRadius: '0.5rem', borderColor: '#475569' }} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="Agreement by video" subtitle="Number of comments per video">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={videoChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderRadius: '0.5rem', borderColor: '#475569' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Unanimous" stackId="a" fill={CHART_COLORS.unanimous} />
                  <Bar dataKey="Disagreement" stackId="a" fill={CHART_COLORS.disagreement} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Mean execution time per model" subtitle="Milliseconds per comment (lower is faster)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => `${Number(value).toLocaleString("en-US")} ms`} contentStyle={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderRadius: '0.5rem', borderColor: '#475569' }}/>
                <Bar dataKey="mean" name="Mean latency" radius={[4, 4, 0, 0]}>
                  {latencyChartData.map((row) => <Cell key={row.name} fill={row.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Latency details" subtitle="Successful calls only">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Model</th>
                  <th className="py-2 pr-4 text-right font-medium">Mean</th>
                  <th className="py-2 pr-4 text-right font-medium">Median</th>
                  <th className="py-2 pr-4 text-right font-medium">P95</th>
                  <th className="py-2 text-right font-medium">n</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics.latency.map((l) => (
                  <tr key={l.model}>
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{MODEL_META[l.model].name}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{metadata.models[l.model]}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums dark:text-slate-300">{formatMs(l.meanMs)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums dark:text-slate-300">{formatMs(l.medianMs)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums dark:text-slate-300">{formatMs(l.p95Ms)}</td>
                    <td className="py-2.5 text-right tabular-nums dark:text-slate-300">{l.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Per-video breakdown">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Video</th>
                <th className="py-2 pr-4 font-medium">YouTube ID</th>
                <th className="py-2 pr-4 text-right font-medium">Comments</th>
                <th className="py-2 pr-4 text-right font-medium">Unanimous</th>
                <th className="py-2 pr-4 text-right font-medium">Disagreement</th>
                <th className="py-2 text-right font-medium">Unanimity rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.byVideo.map((v) => (
                <tr key={v.videoId}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">{v.label}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-600 dark:text-slate-400">{v.videoId}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums dark:text-slate-300">{v.total}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums dark:text-slate-300">{v.unanimous}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums dark:text-slate-300">{v.disagreement}</td>
                  <td className="py-2.5 text-right tabular-nums dark:text-slate-300">{formatPercent(v.agreementRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}