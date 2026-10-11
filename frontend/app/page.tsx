import Link from "next/link";
import { ArrowRight, AlertTriangle, BrainCircuit, ShieldAlert, Users, Server, CheckCircle2, GitBranch } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 pb-12">
      <section className="relative overflow-hidden rounded-3xl bg-blue-700 px-6 py-20 text-center dark:bg-blue-900 sm:px-12 sm:py-24">
        <div className="relative z-10 mx-auto max-w-3xl text-white">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Multi-Model Consensus Architecture
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100 sm:text-xl">
            A PIBIC Scientific Initiation project designed to evaluate the safety and reliability of Large Language Models (LLMs) in detecting suicide risk within public social media comments.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              View Analytics <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/arbitration"
              className="inline-flex items-center gap-2 rounded-full border border-blue-400 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 dark:border-blue-700 dark:hover:bg-blue-800"
            >
              Start Arbitration <ShieldAlert className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-600 blur-3xl opacity-50 dark:bg-blue-800"></div>
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-800 blur-3xl opacity-50 dark:bg-blue-950"></div>
      </section>

      <section className="mx-auto max-w-5xl">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center rounded-lg bg-rose-100 p-3 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">The Problem</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Relying on a single Artificial Intelligence model to triage sensitive mental health data is dangerous. Our empirical tests with local models revealed critical flaws: false positives (failing to recognize sarcasm) and life-threatening false negatives (downgrading active suicide attempts to mere ideation).
            </p>
          </div>
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center rounded-lg bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">The Solution</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We engineered a Tri-Model architecture that forces three distinct AI engines to vote on severity. If the models lack complete unanimity, the system suspends automated decision-making and routes the divergent data to a "Human-in-the-Loop" dashboard for final arbitration by a licensed psychologist.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 dark:text-white">Pipeline Architecture</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">1. Data Extraction</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">YouTube API fetches raw comments from mental health content.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">2. Tri-Model Inference</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">GPT-4o-mini, Gemini Flash, and local Llama evaluate severity concurrently.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">3. Consensus Engine</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Algorithmic check filters unanimous decisions vs. disagreements.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">4. Human-in-the-Loop</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Clinical arbitration dashboard validates the ground truth.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl pt-8">
        <h2 className="mb-10 text-center text-3xl font-bold text-slate-900 dark:text-white">The Research Team</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Augusto */}
          <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              AO
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Augusto Ortigoso Barbosa</h3>
              <p className="font-medium text-blue-600 dark:text-blue-400">Lead Researcher & Developer</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Responsible for the engineering pipeline, API integrations, and the development of the full-stack architecture (Python & Next.js).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              PF
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prof. Fabíola Souza Fernandes Pereira</h3>
              <p className="font-medium text-blue-600 dark:text-blue-400">Academic Advisor</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Guiding the academic methodology, clinical taxonomy criteria, and overseeing the psychological evaluation standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-12 text-center dark:border-slate-800">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Built with Modern Technologies</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {["Python 3.12", "Next.js 15", "React 19", "Tailwind CSS v4", "Ollama", "OpenAI API", "Google GenAI", "Vercel"].map((tech) => (
            <span key={tech} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}