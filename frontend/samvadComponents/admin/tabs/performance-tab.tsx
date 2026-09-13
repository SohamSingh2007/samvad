"use client";

import React, { useState } from "react";
import {
  Activity,
  Zap,
  Gauge,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  Database,
  Radio,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";

export function PerformanceTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRunDiagnostics = () => {
    setIsRefreshing(true);
    toast.info("Running live WebRTC & ISL latency test...", {
      description: "Pinging global edge relays and local vision inference workers",
    });
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Diagnostics completed successfully", {
        description: "All endpoints responded within 26ms (optimal threshold < 60ms)",
      });
    }, 1200);
  };

  const telemetryGauges = [
    {
      name: "WebRTC Audio/Video Latency (RTT)",
      value: "24 ms",
      p95: "58 ms",
      status: "Optimal",
      change: "-4.2ms vs baseline",
      positive: true,
      bars: [30, 25, 28, 22, 24, 26, 21, 24, 25, 23, 24, 22, 25, 24],
    },
    {
      name: "ISL Gesture Inference Time",
      value: "18.2 ms",
      p95: "32 ms",
      status: "Optimal",
      change: "60 FPS stable",
      positive: true,
      bars: [22, 20, 19, 18, 17, 18, 19, 18, 18, 17, 18, 19, 18, 18],
    },
    {
      name: "Whisper STT Subtitle Generation",
      value: "42 ms",
      p95: "85 ms",
      status: "Optimal",
      change: "Streaming token buffer",
      positive: true,
      bars: [48, 45, 42, 40, 43, 44, 41, 42, 43, 42, 40, 41, 43, 42],
    },
    {
      name: "WebRTC Packet Loss Rate",
      value: "0.012 %",
      p95: "0.04 %",
      status: "Exceptional",
      change: "FEC enabled",
      positive: true,
      bars: [2, 1, 3, 1, 0, 1, 2, 1, 1, 2, 1, 0, 1, 1],
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Performance & Latency Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Monitor real-time network jitter, ISL computer vision latency, and speech transcription pipelines.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunDiagnostics}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Pinging..." : "Run Diagnostics"}</span>
        </button>
      </div>

      {/* 2. Core Telemetry Cards with Sparkline Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {telemetryGauges.map((gauge, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                {gauge.name}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                {gauge.status}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  {gauge.value}
                </span>
                <span className="text-xs text-stone-400 ml-2">
                  (95th percentile: {gauge.p95})
                </span>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {gauge.change}
              </span>
            </div>

            {/* Sparkline Visual Bar Array */}
            <div className="pt-2">
              <div className="flex items-end gap-1.5 h-12 w-full">
                {gauge.bars.map((val, bIdx) => {
                  const maxVal = Math.max(...gauge.bars);
                  const heightPercent = Math.max(15, (val / maxVal) * 100);
                  return (
                    <div
                      key={bIdx}
                      className="flex-1 bg-stone-200 dark:bg-stone-800 hover:bg-blue-500 dark:hover:bg-blue-400 rounded-t transition-colors relative group"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                        {val}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>15 mins ago</span>
                <span>Current</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Hardware & Compute Cluster Utilization */}
      <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Node Resources & AI Acceleration
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Utilization breakdown across CPU cores, Tensor/GPU vision pipelines, and session memory caches.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* CPU Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-500" /> Host CPU Usage
              </span>
              <span className="text-stone-900 dark:text-stone-100 font-bold">34.8%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: "34.8%" }} />
            </div>
            <span className="text-[11px] text-stone-400">16 Cores | Average clock 3.2 GHz</span>
          </div>

          {/* GPU / AI Vision */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> ISL Tensor Accelerator
              </span>
              <span className="text-stone-900 dark:text-stone-100 font-bold">48.2%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: "48.2%" }} />
            </div>
            <span className="text-[11px] text-stone-400">NVIDIA TensorRT | 4,200 inferences/sec</span>
          </div>

          {/* Memory / Cache */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-500" /> Redis State Cache
              </span>
              <span className="text-stone-900 dark:text-stone-100 font-bold">22.4%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: "22.4%" }} />
            </div>
            <span className="text-[11px] text-stone-400">14.3 GB of 64 GB provisioned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
