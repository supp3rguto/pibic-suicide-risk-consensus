import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tri-Model Consensus | Suicide-Risk Detection (PIBIC)",
  description: "Human-in-the-loop arbitration for mental health analysis in YouTube comments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
          <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-slate-400 dark:text-slate-600 sm:px-6">
            Research prototype (PIBIC). Model outputs are not clinical diagnoses.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}