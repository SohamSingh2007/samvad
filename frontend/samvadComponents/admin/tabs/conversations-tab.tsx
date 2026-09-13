"use client";

import React, { useState } from "react";
import {
  MessageSquareMore,
  Search,
  Download,
  Calendar,
  Clock,
  User,
  Sparkles,
  FileText,
  Filter,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { ConversationLog } from "../types";

export function ConversationsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<string>("conv-1");

  const conversationLogs: ConversationLog[] = [
    {
      id: "conv-1",
      meetingId: "sam-tech-829",
      meetingTitle: "Accessible Tech Standup: ISL Group",
      host: "Aarav Sharma",
      timestamp: "Today at 2:15 PM",
      duration: "24 mins",
      participants: 8,
      snippet: "Discussing sign language landmark detector updates and WebRTC frame sync...",
      gesturesDetected: 42,
      audioQuality: "Excellent",
      captionsAccuracy: "99.2%",
      transcriptSample: [
        {
          speaker: "Aarav Sharma",
          time: "00:02",
          text: "Welcome everyone to our weekly standup.",
          gesture: "🙏 Namaste / Welcome",
        },
        {
          speaker: "Priya Patel",
          time: "00:14",
          text: "The new hand landmark pipeline is now streaming at 60 frames per second with no frame drops.",
          gesture: "👍 Confirmed / Good",
        },
        {
          speaker: "Rohan Verma",
          time: "00:32",
          text: "Do we have the test dataset for regional variations in Indian Sign Language gestures?",
          gesture: "❓ Question",
        },
        {
          speaker: "Aarav Sharma",
          time: "00:48",
          text: "Yes, we incorporated 1,400 curated video clips from deaf community centers across Delhi and Bengaluru.",
          gesture: "🤝 Agreement",
        },
      ],
    },
    {
      id: "conv-2",
      meetingId: "sam-des-401",
      meetingTitle: "Design System Accessibility Review",
      host: "Priya Patel",
      timestamp: "Today at 11:30 AM",
      duration: "42 mins",
      participants: 14,
      snippet: "Color contrast testing on dark mode toasts and navbar height alignment across breakpoints...",
      gesturesDetected: 18,
      audioQuality: "Excellent",
      captionsAccuracy: "98.8%",
      transcriptSample: [
        {
          speaker: "Priya Patel",
          time: "00:05",
          text: "Let's review the navbar pill elements to ensure all heights match 42 pixels.",
          gesture: "📐 Measured",
        },
        {
          speaker: "Kavita Rao",
          time: "00:22",
          text: "All inputs and action buttons now line up with exact pixel precision.",
          gesture: "✨ Excellent",
        },
      ],
    },
    {
      id: "conv-3",
      meetingId: "sam-edu-754",
      meetingTitle: "Speech & Sign Interactive Class",
      host: "Dr. Ananya Roy",
      timestamp: "Yesterday at 4:00 PM",
      duration: "55 mins",
      participants: 32,
      snippet: "Teaching foundational sign alphabet and interactive gesture testing with live AI feedback...",
      gesturesDetected: 114,
      audioQuality: "Good",
      captionsAccuracy: "97.5%",
      transcriptSample: [
        {
          speaker: "Dr. Ananya Roy",
          time: "00:10",
          text: "Today we will practice conversational greetings and basic numbers.",
          gesture: "👋 Greetings",
        },
      ],
    },
  ];

  const filteredLogs = conversationLogs.filter(
    (log) =>
      log.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.meetingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLog =
    conversationLogs.find((log) => log.id === selectedLogId) ||
    conversationLogs[0];

  const handleExport = (format: "json" | "txt") => {
    toast.success(`Exported ${activeLog.meetingTitle}`, {
      description: `Format: ${format.toUpperCase()} with ${activeLog.transcriptSample.length} verified dialogue turns`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Conversations & Transcript Archives
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Inspect live transcripts, recognized sign gesture tokens, and audio fidelity records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport("txt")}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Text
          </button>
          <button
            type="button"
            onClick={() => handleExport("json")}
            className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* 2. Main Two-Column View: Log List + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Search & Conversation Log List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings, hosts, or keywords..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:border-blue-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 shadow-2xs"
            />
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const isSelected = log.id === selectedLogId;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white dark:bg-stone-900 border-blue-500/80 shadow-sm ring-1 ring-blue-500/20"
                      : "bg-white/70 dark:bg-stone-900/60 border-stone-200/70 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">
                      {log.meetingTitle}
                    </h3>
                    <span className="text-[10px] font-mono text-stone-400 shrink-0">
                      {log.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    {log.snippet}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800/60">
                    <span>Host: {log.host}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-3 h-3" /> {log.gesturesDetected} signs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Transcript & Signal Inspector (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {activeLog.meetingTitle}
                </h2>
                <span className="text-[11px] font-mono bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-600 dark:text-stone-300">
                  {activeLog.meetingId}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Host: {activeLog.host} • Duration: {activeLog.duration} • Participants: {activeLog.participants}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> {activeLog.captionsAccuracy} STT
              </span>
            </div>
          </div>

          {/* Transcript Dialogue List */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Real-time Dialogue & Sign Tokens
            </h3>

            <div className="space-y-3">
              {activeLog.transcriptSample.map((turn, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-900 dark:text-stone-200">
                      {turn.speaker}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      {turn.time}
                    </span>
                  </div>

                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {turn.text}
                  </p>

                  {turn.gesture && (
                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/70 px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        ISL Gesture: {turn.gesture}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
