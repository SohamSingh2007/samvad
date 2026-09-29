"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Mail, Sparkles, Shield, HeartHandshake } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePageTemplates } from "@/lib/template-config";

export default function AboutPage() {
  const { templates } = usePageTemplates();
  const about = templates.about;

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
            <span className="px-2.5 py-1 rounded bg-[#c25e2e]/10 text-[#c25e2e] text-xs font-bold tracking-wide uppercase">
              About Samvad
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
              {about.title}
            </h1>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
              {about.tagline}
            </p>
          </div>

          {/* Mission Box */}
          <div className="p-6 sm:p-8 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-semibold text-sm">
              <HeartHandshake className="w-4 h-4 text-[#c25e2e]" />
              <h3>Our Core Mission</h3>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {about.mission}
            </p>
          </div>

          {/* Story Box */}
          <div className="p-6 sm:p-8 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h3>Foundational Story & Vision</h3>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {about.story}
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              System Capabilities & Innovations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {about.highlights.map((h, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs flex items-center gap-3 text-xs font-medium text-stone-800 dark:text-stone-200"
                >
                  <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Inquiries Footer */}
          <div className="p-5 rounded-lg bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <Mail className="w-4 h-4 text-stone-500" />
              <span>Have questions, research inquiries, or partnership feedback?</span>
            </div>
            <a
              href={`mailto:${about.contactEmail}`}
              className="font-semibold text-stone-900 dark:text-stone-100 hover:underline"
            >
              {about.contactEmail}
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-900 py-6 text-center text-xs text-stone-500">
        <p>© 2026 Samvad Inc. Accessible by design.</p>
      </footer>
    </div>
  );
}
