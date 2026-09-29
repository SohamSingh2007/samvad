"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, AlertTriangle, Lock, Mail, Scale } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePageTemplates } from "@/lib/template-config";

export default function TermsPage() {
  const { templates } = usePageTemplates();
  const terms = templates.terms;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200 bg-dot-grid">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-950/80 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center group">
            <Image
              src="/logo-light.svg"
              alt="Samvad"
              width={130}
              height={34}
              className="h-8 w-auto object-contain dark:hidden transition-opacity group-hover:opacity-80"
              priority
            />
            <Image
              src="/logo-dark.svg"
              alt="Samvad"
              width={130}
              height={34}
              className="h-8 w-auto object-contain hidden dark:block transition-opacity group-hover:opacity-80"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3 pb-6 border-b border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold tracking-wide uppercase">
                Legal & Governance
              </span>
              <span className="text-xs text-stone-500">Effective: {terms.lastUpdated}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
              {terms.title}
            </h1>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl">
              {terms.introduction}
            </p>
          </div>

          {/* AI Sign Language Interpretation Disclaimer */}
          <div className="p-6 sm:p-8 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3>1. AI Sign Language Translation Disclaimer</h3>
            </div>
            <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              {terms.aiSignLanguageDisclaimer}
            </p>
          </div>

          {/* Acceptable Use */}
          <div className="p-6 sm:p-8 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-semibold text-sm">
              <Scale className="w-4 h-4 text-stone-500" />
              <h3>2. Acceptable Use Policy</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {terms.acceptableUse}
            </p>
          </div>

          {/* Privacy & Data Protection */}
          <div className="p-6 sm:p-8 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-semibold text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3>3. Privacy & Media Encryption</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {terms.privacySummary}
            </p>
          </div>

          {/* Legal Inquiries Footer */}
          <div className="p-5 rounded-lg bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <Mail className="w-4 h-4 text-stone-500" />
              <span>For legal inquiries, copyright claims, or privacy notices:</span>
            </div>
            <a
              href={`mailto:${terms.contactEmail}`}
              className="font-semibold text-stone-900 dark:text-stone-100 hover:underline"
            >
              {terms.contactEmail}
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-900 py-6 text-center text-xs text-stone-500">
        <p>© 2026 Samvad Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
