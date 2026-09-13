"use client";

import React, { useState } from "react";
import {
  Users,
  Video,
  Activity,
  ShieldCheck,
  TrendingUp,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ArrowUpRight,
  Server,
  Zap,
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { LiveRoom, MetricCardData } from "../types";

export function DashboardTab() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const metrics: MetricCardData[] = [
    {
      id: "active-meetings",
      title: "Active Meetings",
      value: "142",
      change: "+14.2%",
      isPositive: true,
      period: "vs last hour",
      subtext: "89 with Indian Sign Language (ISL)",
    },
    {
      id: "isl-accuracy",
      title: "ISL AI Accuracy",
      value: "98.6%",
      change: "+0.8%",
      isPositive: true,
      period: "model v2.4",
      subtext: "18ms avg gesture inference latency",
    },
    {
      id: "total-users",
      title: "Active Participants",
      value: "1,248",
      change: "+28.4%",
      isPositive: true,
      period: "peak session",
      subtext: "8,420 total registered accounts",
    },
    {
      id: "system-uptime",
      title: "Platform Health",
      value: "99.98%",
      change: "Normal",
      isPositive: true,
      period: "past 30 days",
      subtext: "0 packet loss detected across WebRTC relays",
    },
  ];

  const liveRooms: LiveRoom[] = [
    {
      id: "room-1",
      title: "Accessible Tech Standup: ISL Group",
      roomCode: "sam-tech-829",
      hostName: "Aarav Sharma",
      participantsCount: 8,
      duration: "24m 12s",
      islEnabled: true,
      status: "live",
      encryption: "e2ee",
    },
    {
      id: "room-2",
      title: "Design System Accessibility Review",
      roomCode: "sam-des-401",
      hostName: "Priya Patel",
      participantsCount: 14,
      duration: "42m 05s",
      islEnabled: true,
      status: "live",
      encryption: "e2ee",
    },
    {
      id: "room-3",
      title: "Executive Board Quarterly Sync",
      roomCode: "sam-exec-109",
      hostName: "Vikram Malhotra",
      participantsCount: 6,
      duration: "11m 40s",
      islEnabled: false,
      status: "live",
      encryption: "e2ee",
    },
    {
      id: "room-4",
      title: "Speech & Sign Interactive Class",
      roomCode: "sam-edu-754",
      hostName: "Dr. Ananya Roy",
      participantsCount: 32,
      duration: "55m 20s",
      islEnabled: true,
      status: "live",
      encryption: "standard",
    },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Room code copied to clipboard", {
      description: code,
      duration: 2500,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            System Overview & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Real-time analytics for Samvad video conferencing, ISL gesture pipelines & WebRTC gateways.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </span>

          <button
            type="button"
            onClick={() => {
              toast.info("Generating system diagnostic report...", {
                description: "Exporting telemetry logs to CSV format",
              });
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/80 text-stone-800 dark:text-stone-200 text-xs font-medium border border-stone-200 dark:border-stone-700 shadow-2xs transition-all cursor-pointer"
          >
            Export Logs
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.id}
            className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {m.title}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3" />
                {m.change}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {m.value}
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {m.period}
              </span>
            </div>

            {m.subtext && (
              <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {m.subtext}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 3. Live Meeting Telemetry & Server Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Active Meetings Table (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Live Video Rooms
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Real-time active rooms with participant counts and assistive AI toggles.
              </p>
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
              4 of 142 shown
            </span>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {liveRooms.map((room) => (
              <div
                key={room.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-stone-50/50 dark:hover:bg-stone-800/30 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {room.title}
                      </h3>
                      {room.islEnabled && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                          <Sparkles className="w-2.5 h-2.5" /> ISL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                      <span>Host: {room.hostName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {room.participantsCount}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {room.duration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(room.roomCode)}
                    title="Copy Room Code"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    {copiedCode === room.roomCode ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-stone-400" />
                    )}
                    <span>{room.roomCode}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toast.info(`Inspecting ${room.title}`, {
                        description: `Room Code: ${room.roomCode} | Host: ${room.hostName}`,
                      });
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    title="Inspect Room Telemetry"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Infrastructure Cluster Status (1 Column) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Infrastructure Clusters
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Real-time worker pool and server health status.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                name: "WebRTC SFU Relays",
                status: "12 / 12 Healthy",
                latency: "14ms",
                load: "28%",
                icon: Radio,
              },
              {
                name: "ISL Vision Workers",
                status: "8 / 8 Online",
                latency: "18ms",
                load: "44%",
                icon: Zap,
              },
              {
                name: "Whisper STT Subtitlers",
                status: "16 / 16 Ready",
                latency: "42ms",
                load: "31%",
                icon: Server,
              },
              {
                name: "E2EE Key Exchange Node",
                status: "Optimal",
                latency: "8ms",
                load: "12%",
                icon: ShieldCheck,
              },
            ].map((node, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-2xs">
                    <node.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {node.name}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      {node.status}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    {node.load}
                  </span>
                  <p className="text-[10px] text-stone-400 font-mono">
                    {node.latency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
