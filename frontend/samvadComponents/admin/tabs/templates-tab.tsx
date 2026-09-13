"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Users,
  Video,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Plus,
  Play,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { MeetingTemplate } from "../types";

export function TemplatesTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const templates: MeetingTemplate[] = [
    {
      id: "tpl-1",
      title: "ISL Inclusive Classroom",
      category: "Accessibility",
      description: "Dual video layout with primary lecturer and pinned Indian Sign Language interpreter stream.",
      recommendedParticipants: "Up to 50 students",
      features: ["Certified ISL Pin", "Real-time Captions", "Hand Landmark HUD", "Gesture Quiz"],
      isPopular: true,
      iconType: "sparkles",
    },
    {
      id: "tpl-2",
      title: "Medical Telehealth Consultation",
      category: "Support",
      description: "HIPAA-grade encrypted room with high-fidelity audio and instant medical terminology translation.",
      recommendedParticipants: "2 - 4 participants",
      features: ["E2EE Encryption", "Medical Terminology STT", "Private Room Lock", "No-cloud Recording"],
      iconType: "shield",
    },
    {
      id: "tpl-3",
      title: "Daily Standup Sprint",
      category: "Team & Agile",
      description: "Fast-paced sync with built-in 15-minute countdown clock and automated AI bullet-point recap.",
      recommendedParticipants: "5 - 15 teammates",
      features: ["15m Timer", "AI Action Items", "Ticket Sync", "Microphone Auto-queue"],
      isPopular: true,
      iconType: "zap",
    },
    {
      id: "tpl-4",
      title: "All-Hands Town Hall",
      category: "Executive",
      description: "High-capacity broadcast session with moderated attendee Q&A and stage presenter controls.",
      recommendedParticipants: "Up to 500 attendees",
      features: ["Stage Management", "Moderated Q&A", "Live Polling", "Multi-lingual Subtitles"],
      isPopular: true,
      iconType: "users",
    },
    {
      id: "tpl-5",
      title: "1-on-1 Interview & Assessment",
      category: "Team & Agile",
      description: "Focused recruitment format with collaborative scratchpad and private interviewer rubric notes.",
      recommendedParticipants: "2 participants",
      features: ["Private Evaluation Notes", "Code Editor", "Screen Record", "Candidate Timekeeper"],
      iconType: "video",
    },
    {
      id: "tpl-6",
      title: "Silent Meeting with AI Captions",
      category: "Accessibility",
      description: "Designed for deaf and hard-of-hearing collaboration with real-time text threads and sign detection.",
      recommendedParticipants: "4 - 20 participants",
      features: ["Zero Audio Mode", "Sign Language AI", "Interactive Whiteboard", "Color-coded Transcript"],
      iconType: "sparkles",
    },
    {
      id: "tpl-7",
      title: "Academic Lecture & Seminar",
      category: "Education",
      description: "Prioritizes slides and screen share with a floating, high-contrast presenter and interpreter box.",
      recommendedParticipants: "Up to 200 participants",
      features: ["Ultra-sharp Screen Share", "Hand Raising Queue", "Attendance Log", "Slide Sync"],
      iconType: "users",
    },
    {
      id: "tpl-8",
      title: "Board Room Executive Sync",
      category: "Executive",
      description: "Strictly confidential executive board meeting with dynamic watermark overlay and access audit.",
      recommendedParticipants: "8 - 18 participants",
      features: ["Dynamic Watermark", "No Screenshot Guard", "E2EE Key Audit", "Ephemerality"],
      iconType: "shield",
    },
    {
      id: "tpl-9",
      title: "Customer Support Help Desk",
      category: "Support",
      description: "Zero-download guest join link with AI background noise cancellation and cobrowsing capabilities.",
      recommendedParticipants: "2 - 5 participants",
      features: ["Instant Guest URL", "Noise Cancellation", "Screen Markup", "Ticket Routing"],
      iconType: "zap",
    },
    {
      id: "tpl-10",
      title: "Accessibility AI Testing Lab",
      category: "Accessibility",
      description: "Development sandbox with live visual hand landmark mesh, model confidence meters, and latency probes.",
      recommendedParticipants: "1 - 6 developers",
      features: ["Landmark Mesh Overlay", "Confidence Probes", "Frame Drops Inspector", "Raw Tensor Export"],
      isPopular: true,
      iconType: "sparkles",
    },
  ];

  const categories = ["All", "Accessibility", "Team & Agile", "Executive", "Education", "Support"];

  const filteredTemplates = templates.filter((tpl) =>
    selectedCategory === "All" ? true : tpl.category === selectedCategory
  );

  const handleDeploy = (tpl: MeetingTemplate) => {
    toast.success(`Template "${tpl.title}" Deployed!`, {
      description: `Room initialized with ${tpl.features.length} preset configurations.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Meeting Templates
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#c25e2e] text-white">
              10 Ready
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Pre-configured room blueprints for inclusive accessibility, high-stakes executive boardrooms, and agile standups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            toast.info("Custom Template Creator", {
              description: "Specify room layouts, AI sign detectors, and security policies.",
            });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs"
                : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Templates Grid (10 Total) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
                  {tpl.category}
                </span>

                {tpl.isPopular && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Popular
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tpl.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed line-clamp-2">
                  {tpl.description}
                </p>
              </div>

              {/* Feature Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tpl.features.map((feat, fIdx) => (
                  <span
                    key={fIdx}
                    className="text-[10px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> {tpl.recommendedParticipants}
              </span>

              <button
                type="button"
                onClick={() => handleDeploy(tpl)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" /> Deploy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
