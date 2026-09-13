"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
  Server,
  Video,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AdminGuide } from "../types";

export function GuidesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>("guide-1");

  const guides: AdminGuide[] = [
    {
      id: "guide-1",
      title: "Calibrating Indian Sign Language (ISL) Video Pipelines",
      category: "AI & ISL",
      readTime: "6 min read",
      summary: "Best practices for configuring 60fps MediaPipe hand landmarks, lighting tolerances, and confidence thresholds.",
      content: [
        "1. Camera Framerate: Ensure participant video input is negotiated at 60 FPS or minimum 30 FPS to capture swift finger-spelling gestures accurately.",
        "2. Lighting Thresholds: The vision model performs best with frontal diffused lighting. Ambient lux sensors should target > 300 lux for minimal motion blur.",
        "3. Confidence Tuning: Set the gesture classification cutoff between 75% and 85% to balance false positives against subtle gesture recognition.",
        "4. Landmark Normalization: Hand coordinate tensors are auto-normalized relative to shoulder and wrist anchor points to support diverse camera angles.",
      ],
    },
    {
      id: "guide-2",
      title: "Configuring WebRTC TURN Servers & Firewall Traversal",
      category: "Infrastructure",
      readTime: "5 min read",
      summary: "Set up Coturn media relays with TLS encryption to ensure seamless connection behind symmetric NATs.",
      content: [
        "1. STUN/TURN Topology: Deploy twin TURN instances in Mumbai and Delhi edge regions for sub-30ms round-trip relay in India.",
        "2. Port Provisioning: Ensure UDP/TCP port 3478 and TLS port 5349 are open in cloud security groups.",
        "3. Ephemeral Credentials: Generate short-lived HMAC-SHA-1 tokens (valid for 24 hours) for connecting meeting participants.",
        "4. Bandwidth Throttling: Set max bitrates to 2.5 Mbps per 1080p stream with adaptive downscaling on poor mobile cellular connections.",
      ],
    },
    {
      id: "guide-3",
      title: "Role-Based Access Control (RBAC) & Security Policies",
      category: "Security",
      readTime: "4 min read",
      summary: "Manage administrative privileges, room moderation roles, and certified ISL interpreter assignments.",
      content: [
        "1. Super Admin: Full system telemetry, user bans, TURN server configs, and billing management.",
        "2. Meeting Host: Room lock, participant mute, recording initiation, and caption export authorization.",
        "3. Certified Interpreter: Dedicated video pin priority, dual-audio feed, and gesture calibration override.",
        "4. Attendee: Standard WebRTC stream, accessible captions, and interactive chat.",
      ],
    },
    {
      id: "guide-4",
      title: "Speech-to-Text Multi-lingual Subtitle Integration",
      category: "AI & ISL",
      readTime: "7 min read",
      summary: "Optimizing Whisper streaming pipelines for real-time speech translation into Hindi, Tamil, and English.",
      content: [
        "1. Token Buffering: Configure 250ms audio chunk buffers to achieve real-time subtitle latency under 50ms.",
        "2. Accent Adaptation: The model applies custom vocabulary prompting for Indian names and technical terminology.",
        "3. Dual Display: Subtitles can be displayed simultaneously in primary English and secondary regional script.",
      ],
    },
  ];

  const categories = ["All", "AI & ISL", "Infrastructure", "Security"];

  const filteredGuides = guides.filter((g) => {
    const matchesCat = selectedCategory === "All" || g.category === selectedCategory;
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Admin Documentation & Guides
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Architectural guides, ISL vision tuning instructions, and server infrastructure configurations.
          </p>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, setup tutorials, or AI guidelines..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:border-blue-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
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
      </div>

      {/* 3. Guide Accordion Cards */}
      <div className="space-y-4">
        {filteredGuides.map((guide) => {
          const isExpanded = expandedGuideId === guide.id;
          return (
            <div
              key={guide.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs transition-all"
            >
              <div
                onClick={() =>
                  setExpandedGuideId(isExpanded ? null : guide.id)
                }
                className="flex items-start justify-between gap-4 cursor-pointer select-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      {guide.category}
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {guide.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    {guide.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                    {guide.summary}
                  </p>
                </div>

                <div className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Expanded Guide Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2.5 animate-in fade-in duration-200">
                  {guide.content.map((point, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
