"use client";

import React from "react";
import {
  Radio,
  MapPin,
  Users,
  Video,
  Activity,
  Zap,
  TrendingUp,
  Globe,
} from "lucide-react";
import { HotspotLocation } from "../types";

export function HotspotsTab() {
  const hotspots: HotspotLocation[] = [
    {
      id: "delhi",
      region: "Delhi NCR",
      country: "India (North)",
      activeMeetings: 54,
      totalUsers: 482,
      sharePercentage: 38,
      latencyMs: 14,
    },
    {
      id: "bengaluru",
      region: "Bengaluru Tech Corridor",
      country: "India (South)",
      activeMeetings: 41,
      totalUsers: 365,
      sharePercentage: 29,
      latencyMs: 12,
    },
    {
      id: "mumbai",
      region: "Mumbai Financial District",
      country: "India (West)",
      activeMeetings: 26,
      totalUsers: 228,
      sharePercentage: 18,
      latencyMs: 15,
    },
    {
      id: "hyderabad",
      region: "Hyderabad & Chennai",
      country: "India (South)",
      activeMeetings: 14,
      totalUsers: 112,
      sharePercentage: 10,
      latencyMs: 18,
    },
    {
      id: "global",
      region: "International (Singapore / US East)",
      country: "Global Relay",
      activeMeetings: 7,
      totalUsers: 61,
      sharePercentage: 5,
      latencyMs: 48,
    },
  ];

  // 24-hour traffic density levels (1-5)
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i}:00`,
    // Simulated peak hours around 10-12 and 15-18
    density:
      i >= 10 && i <= 12
        ? 5
        : i >= 14 && i <= 18
        ? 4
        : i >= 8 && i <= 20
        ? 3
        : i >= 6 && i <= 22
        ? 2
        : 1,
  }));

  const getDensityColor = (density: number) => {
    switch (density) {
      case 5:
        return "bg-blue-600 dark:bg-blue-500 text-white";
      case 4:
        return "bg-blue-500/80 dark:bg-blue-600/80 text-white";
      case 3:
        return "bg-blue-400/60 dark:bg-blue-700/60 text-stone-900 dark:text-stone-100";
      case 2:
        return "bg-blue-200/60 dark:bg-blue-900/40 text-stone-700 dark:text-stone-300";
      default:
        return "bg-stone-100 dark:bg-stone-800 text-stone-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Regional Hotspots & Usage Heatmaps
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Identify peak traffic hours, high-density edge hubs, and regional latency distribution.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
          <Globe className="w-3.5 h-3.5" /> 5 Active Edge Regions
        </span>
      </div>

      {/* 2. Top Regional Traffic Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotspots.map((spot) => (
          <div
            key={spot.id}
            className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-stone-400">{spot.country}</span>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {spot.region}
                </h3>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                {spot.sharePercentage}% Traffic
              </span>
            </div>

            {/* Distribution Bar */}
            <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                style={{ width: `${spot.sharePercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-1">
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5" /> {spot.activeMeetings} rooms
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {spot.totalUsers} users
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {spot.latencyMs}ms RTT
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Hourly Activity Heatmap */}
      <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            24-Hour Peak Usage Heatmap
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Meeting density across hours of the day. Highest load observed during morning standup & afternoon review blocks.
          </p>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5 pt-2">
          {hours.map((h) => (
            <div
              key={h.hour}
              className={`h-12 rounded-lg flex flex-col items-center justify-center p-1 text-[10px] font-mono transition-transform hover:scale-105 select-none ${getDensityColor(
                h.density
              )}`}
              title={`Hour ${h.label}: Level ${h.density} Traffic`}
            >
              <span className="font-bold">{h.hour}h</span>
              <span className="text-[9px] opacity-80">L{h.density}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500">
          <span>00:00 (Midnight)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400 mr-1">Load:</span>
            <span className="w-3 h-3 rounded bg-stone-100 dark:bg-stone-800" title="Low" />
            <span className="w-3 h-3 rounded bg-blue-200/60 dark:bg-blue-900/40" title="Moderate" />
            <span className="w-3 h-3 rounded bg-blue-400/60 dark:bg-blue-700/60" title="High" />
            <span className="w-3 h-3 rounded bg-blue-600 dark:bg-blue-500" title="Peak" />
          </div>
          <span>23:59 (Night)</span>
        </div>
      </div>
    </div>
  );
}
