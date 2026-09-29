"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ExternalLink,
  Edit3,
  Eye,
  RotateCcw,
  X,
  Share2,
  MailCheck,
  KeyRound,
  Shield,
  Info,
  Check,
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import {
  usePageTemplates,
  AboutPageTemplate,
  TermsPageTemplate,
  SocialLinksTemplate,
  VerificationPageTemplate,
  ForgotPasswordPageTemplate,
  DEFAULT_PAGE_TEMPLATES,
} from "@/lib/template-config";

type EditableTemplateType = "about" | "terms" | "socialLinks" | "verification" | "forgotPassword";

export function TemplatesTab() {
  const { templates: config, saveTemplates, resetTemplates } = usePageTemplates();

  // Modal states
  const [editingTemplate, setEditingTemplate] = useState<EditableTemplateType | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EditableTemplateType | null>(null);

  // Draft form states for editing
  const [aboutDraft, setAboutDraft] = useState<AboutPageTemplate>(config.about);
  const [termsDraft, setTermsDraft] = useState<TermsPageTemplate>(config.terms);
  const [socialDraft, setSocialDraft] = useState<SocialLinksTemplate>(config.socialLinks);
  const [verifyDraft, setVerifyDraft] = useState<VerificationPageTemplate>(config.verification);
  const [forgotDraft, setForgotDraft] = useState<ForgotPasswordPageTemplate>(config.forgotPassword);

  const openEditor = (type: EditableTemplateType) => {
    if (type === "about") setAboutDraft({ ...config.about });
    if (type === "terms") setTermsDraft({ ...config.terms });
    if (type === "socialLinks") setSocialDraft({ ...config.socialLinks });
    if (type === "verification") setVerifyDraft({ ...config.verification });
    if (type === "forgotPassword") setForgotDraft({ ...config.forgotPassword });
    setEditingTemplate(type);
  };

  const handleSaveAbout = (e: React.FormEvent) => {
    e.preventDefault();
    saveTemplates({ about: aboutDraft });
    setEditingTemplate(null);
    toast.success("About page template updated", {
      description: "Changes saved to system configuration.",
    });
  };

  const handleSaveTerms = (e: React.FormEvent) => {
    e.preventDefault();
    saveTemplates({ terms: termsDraft });
    setEditingTemplate(null);
    toast.success("Terms & Conditions template updated", {
      description: "Policy revisions are now active.",
    });
  };

  const handleSaveSocial = (e: React.FormEvent) => {
    e.preventDefault();
    saveTemplates({ socialLinks: socialDraft });
    setEditingTemplate(null);
    toast.success("Social links template updated", {
      description: "Landing page social buttons updated.",
    });
  };

  const handleSaveVerification = (e: React.FormEvent) => {
    e.preventDefault();
    saveTemplates({ verification: verifyDraft });
    setEditingTemplate(null);
    toast.success("Verification page template updated", {
      description: "OTP copy and cooldown updated.",
    });
  };

  const handleSaveForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    saveTemplates({ forgotPassword: forgotDraft });
    setEditingTemplate(null);
    toast.success("Forgot password template updated", {
      description: "Reset instructions copy updated.",
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Templates
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Configure website text templates, legal terms, landing page social channels, and authentication pages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm("Reset all page templates back to default system copy?")) {
              resetTemplates();
              toast.info("Templates reset to defaults");
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
        </button>
      </div>

      {/* 2. Grid of Page & Policy Templates (Box Shaped) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: About Page Template */}
        <div className="p-5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/60">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  About Page Template
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                Headline, mission statement, foundational story, core tech highlights, and team contact.
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800 text-xs space-y-1">
              <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                {config.about.title}
              </div>
              <div className="text-stone-500 dark:text-stone-400 text-[11px] line-clamp-2">
                {config.about.mission}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setPreviewTemplate("about")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              type="button"
              onClick={() => openEditor("about")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Template
            </button>
          </div>
        </div>

        {/* Card 2: Terms & Conditions */}
        <div className="p-5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/60">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Terms & Conditions
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                Usage policies, ASL sign language AI liability disclaimer, and privacy protections.
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                  {config.terms.title}
                </span>
                <span className="text-stone-400">{config.terms.lastUpdated}</span>
              </div>
              <div className="text-stone-500 dark:text-stone-400 text-[11px] line-clamp-2">
                {config.terms.aiSignLanguageDisclaimer}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setPreviewTemplate("terms")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              type="button"
              onClick={() => openEditor("terms")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Template
            </button>
          </div>
        </div>

        {/* Card 3: Landing Social Links */}
        <div className="p-5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-900/60">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Landing Social Links
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                Social community channels displayed in the landing page footer and documentation links.
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800 text-xs flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[10px] font-medium text-stone-700 dark:text-stone-300">
                GitHub: {config.socialLinks.github ? "Configured" : "None"}
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[10px] font-medium text-stone-700 dark:text-stone-300">
                X: {config.socialLinks.twitter ? "Configured" : "None"}
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[10px] font-medium text-stone-700 dark:text-stone-300">
                Discord: {config.socialLinks.discord ? "Configured" : "None"}
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[10px] font-medium text-stone-700 dark:text-stone-300">
                LinkedIn: {config.socialLinks.linkedin ? "Configured" : "None"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Landing
            </Link>
            <button
              type="button"
              onClick={() => openEditor("socialLinks")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Template
            </button>
          </div>
        </div>

        {/* Card 4: Verification Page */}
        <div className="p-5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/60">
                  <MailCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Verification Page
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                Headline, instructions, OTP code length, resend cooldown timer, and success messaging.
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                  {config.verification.title}
                </span>
                <span className="text-stone-400">{config.verification.resendCooldownSeconds}s timer</span>
              </div>
              <div className="text-stone-500 dark:text-stone-400 text-[11px] line-clamp-2">
                {config.verification.description}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <Link
              href="/verify"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View /verify
            </Link>
            <button
              type="button"
              onClick={() => openEditor("verification")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Template
            </button>
          </div>
        </div>

        {/* Card 5: Forgot Password Page */}
        <div className="p-5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Forgot Password Page
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                Heading, instructions, submit button label, dispatch notice, and security advice.
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                  {config.forgotPassword.title}
                </span>
                <span className="text-stone-400 font-mono text-[10px]">{config.forgotPassword.buttonText}</span>
              </div>
              <div className="text-stone-500 dark:text-stone-400 text-[11px] line-clamp-2">
                {config.forgotPassword.description}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <Link
              href="/forgot-password"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View /forgot-password
            </Link>
            <button
              type="button"
              onClick={() => openEditor("forgotPassword")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Template
            </button>
          </div>
        </div>
      </div>

      {/* ================= EDIT MODAL: ABOUT PAGE ================= */}
      {editingTemplate === "about" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Edit About Page Template
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Customize the headline, mission statement, foundational story, and contact details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAbout} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Page Title / Headline
                </label>
                <input
                  type="text"
                  value={aboutDraft.title}
                  onChange={(e) => setAboutDraft({ ...aboutDraft, title: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  value={aboutDraft.tagline}
                  onChange={(e) => setAboutDraft({ ...aboutDraft, tagline: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Mission Statement
                </label>
                <textarea
                  rows={3}
                  value={aboutDraft.mission}
                  onChange={(e) => setAboutDraft({ ...aboutDraft, mission: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  About Story & Platform Vision
                </label>
                <textarea
                  rows={3}
                  value={aboutDraft.story}
                  onChange={(e) => setAboutDraft({ ...aboutDraft, story: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Contact / Inquiries Email
                </label>
                <input
                  type="email"
                  value={aboutDraft.contactEmail}
                  onChange={(e) => setAboutDraft({ ...aboutDraft, contactEmail: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setAboutDraft({ ...DEFAULT_PAGE_TEMPLATES.about })}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                >
                  Reset default about text
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-3.5 py-2 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL: TERMS & CONDITIONS ================= */}
      {editingTemplate === "terms" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Edit Terms & Conditions Template
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Update acceptable use, legal disclaimer for sign language AI, and privacy terms.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTerms} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={termsDraft.title}
                    onChange={(e) => setTermsDraft({ ...termsDraft, title: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                    Effective / Last Updated Date
                  </label>
                  <input
                    type="text"
                    value={termsDraft.lastUpdated}
                    onChange={(e) => setTermsDraft({ ...termsDraft, lastUpdated: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Introduction Paragraph
                </label>
                <textarea
                  rows={2}
                  value={termsDraft.introduction}
                  onChange={(e) => setTermsDraft({ ...termsDraft, introduction: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  AI Sign Language Interpretation Disclaimer
                </label>
                <textarea
                  rows={3}
                  value={termsDraft.aiSignLanguageDisclaimer}
                  onChange={(e) => setTermsDraft({ ...termsDraft, aiSignLanguageDisclaimer: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Acceptable Use Policy
                </label>
                <textarea
                  rows={2}
                  value={termsDraft.acceptableUse}
                  onChange={(e) => setTermsDraft({ ...termsDraft, acceptableUse: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Privacy & Data Summary
                </label>
                <textarea
                  rows={2}
                  value={termsDraft.privacySummary}
                  onChange={(e) => setTermsDraft({ ...termsDraft, privacySummary: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Legal Contact Email
                </label>
                <input
                  type="email"
                  value={termsDraft.contactEmail}
                  onChange={(e) => setTermsDraft({ ...termsDraft, contactEmail: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setTermsDraft({ ...DEFAULT_PAGE_TEMPLATES.terms })}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                >
                  Reset default terms
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-3.5 py-2 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL: SOCIAL LINKS ================= */}
      {editingTemplate === "socialLinks" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Edit Landing Social Links
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Update external URLs for social channels linked across the site.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSocial} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={socialDraft.github}
                  onChange={(e) => setSocialDraft({ ...socialDraft, github: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Twitter / X Profile URL
                </label>
                <input
                  type="url"
                  value={socialDraft.twitter}
                  onChange={(e) => setSocialDraft({ ...socialDraft, twitter: e.target.value })}
                  placeholder="https://twitter.com/..."
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Discord Community URL
                </label>
                <input
                  type="url"
                  value={socialDraft.discord}
                  onChange={(e) => setSocialDraft({ ...socialDraft, discord: e.target.value })}
                  placeholder="https://discord.gg/..."
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  LinkedIn Organization URL
                </label>
                <input
                  type="url"
                  value={socialDraft.linkedin}
                  onChange={(e) => setSocialDraft({ ...socialDraft, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  YouTube / Video Channel URL
                </label>
                <input
                  type="url"
                  value={socialDraft.youtube}
                  onChange={(e) => setSocialDraft({ ...socialDraft, youtube: e.target.value })}
                  placeholder="https://youtube.com/@..."
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setSocialDraft({ ...DEFAULT_PAGE_TEMPLATES.socialLinks })}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                >
                  Reset default links
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-3.5 py-2 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL: VERIFICATION PAGE ================= */}
      {editingTemplate === "verification" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Edit Verification Page Template
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Customize the copy, instructions, resend timeout, and confirmation messages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVerification} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Page Title / Headline
                </label>
                <input
                  type="text"
                  value={verifyDraft.title}
                  onChange={(e) => setVerifyDraft({ ...verifyDraft, title: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Instructions Description
                </label>
                <textarea
                  rows={2}
                  value={verifyDraft.description}
                  onChange={(e) => setVerifyDraft({ ...verifyDraft, description: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                    Resend Cooldown (Seconds)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={verifyDraft.resendCooldownSeconds}
                    onChange={(e) =>
                      setVerifyDraft({
                        ...verifyDraft,
                        resendCooldownSeconds: parseInt(e.target.value) || 45,
                      })
                    }
                    required
                    className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                    Support Link Text
                  </label>
                  <input
                    type="text"
                    value={verifyDraft.helpLinkText}
                    onChange={(e) => setVerifyDraft({ ...verifyDraft, helpLinkText: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Success State Title
                </label>
                <input
                  type="text"
                  value={verifyDraft.successTitle}
                  onChange={(e) => setVerifyDraft({ ...verifyDraft, successTitle: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Success State Description
                </label>
                <input
                  type="text"
                  value={verifyDraft.successDescription}
                  onChange={(e) => setVerifyDraft({ ...verifyDraft, successDescription: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setVerifyDraft({ ...DEFAULT_PAGE_TEMPLATES.verification })}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                >
                  Reset default verify text
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-3.5 py-2 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL: FORGOT PASSWORD ================= */}
      {editingTemplate === "forgotPassword" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Edit Forgot Password Template
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Update password recovery instructions, button label, and security advice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Page Title / Headline
                </label>
                <input
                  type="text"
                  value={forgotDraft.title}
                  onChange={(e) => setForgotDraft({ ...forgotDraft, title: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Instructions Description
                </label>
                <textarea
                  rows={2}
                  value={forgotDraft.description}
                  onChange={(e) => setForgotDraft({ ...forgotDraft, description: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Action Button Label
                </label>
                <input
                  type="text"
                  value={forgotDraft.buttonText}
                  onChange={(e) => setForgotDraft({ ...forgotDraft, buttonText: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Confirmation Modal / Success Heading
                </label>
                <input
                  type="text"
                  value={forgotDraft.successTitle}
                  onChange={(e) => setForgotDraft({ ...forgotDraft, successTitle: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Confirmation Message Text
                </label>
                <textarea
                  rows={2}
                  value={forgotDraft.successDescription}
                  onChange={(e) => setForgotDraft({ ...forgotDraft, successDescription: e.target.value })}
                  required
                  className="w-full p-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Security Expiry Notice
                </label>
                <input
                  type="text"
                  value={forgotDraft.securityNotice}
                  onChange={(e) => setForgotDraft({ ...forgotDraft, securityNotice: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setForgotDraft({ ...DEFAULT_PAGE_TEMPLATES.forgotPassword })}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                >
                  Reset default forgot password text
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-3.5 py-2 rounded-md text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PREVIEW MODAL ================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-stone-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {previewTemplate === "about" && "Live Preview: About Template"}
                  {previewTemplate === "terms" && "Live Preview: Terms & Conditions"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewTemplate === "about" && (
              <div className="space-y-4 text-xs">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                    {config.about.title}
                  </h2>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-1">
                    {config.about.tagline}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 space-y-2">
                  <h4 className="font-semibold text-stone-800 dark:text-stone-200 text-xs">Our Mission</h4>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                    {config.about.mission}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 space-y-2">
                  <h4 className="font-semibold text-stone-800 dark:text-stone-200 text-xs">Foundational Story</h4>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                    {config.about.story}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-800 dark:text-stone-200 text-xs mb-2">Key Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {config.about.highlights.map((h, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                  Inquiries: <span className="text-stone-700 dark:text-stone-300 font-medium">{config.about.contactEmail}</span>
                </div>
              </div>
            )}

            {previewTemplate === "terms" && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                      {config.terms.title}
                    </h2>
                    <span className="text-stone-400">Effective: {config.terms.lastUpdated}</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                    {config.terms.introduction}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 space-y-2">
                  <h4 className="font-semibold text-stone-800 dark:text-stone-200 text-xs">AI Sign Language Interpretation Disclaimer</h4>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                    {config.terms.aiSignLanguageDisclaimer}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 space-y-2">
                  <h4 className="font-semibold text-stone-800 dark:text-stone-200 text-xs">Acceptable Use</h4>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                    {config.terms.acceptableUse}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 space-y-2">
                  <h4 className="font-semibold text-stone-800 dark:text-stone-200 text-xs">Privacy & Data Protections</h4>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                    {config.terms.privacySummary}
                  </p>
                </div>

                <div className="text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                  Legal Contact: <span className="text-stone-700 dark:text-stone-300 font-medium">{config.terms.contactEmail}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
