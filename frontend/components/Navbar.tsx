"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardCheck, ShieldPlus, Home } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "About", icon: Home },
  { href: "/analytics", label: "Analytics", icon: Activity },
  { href: "/arbitration", label: "Arbitration", icon: ClipboardCheck },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white dark:bg-blue-600">
            <ShieldPlus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tri-Model Consensus</p>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Suicide-risk detection &middot; PIBIC</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
          <nav className="flex gap-1" aria-label="Main navigation">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}