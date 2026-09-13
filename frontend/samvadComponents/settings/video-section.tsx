"use client";

import React, { useState } from "react";
import { Video, Sparkles, FlipHorizontal, ShieldCheck, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface VideoSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function VideoSection({ settings, onUpdate }: VideoSectionProps) {
  const [isPreviewActive, setIsPreviewActive] = useState(true);

  const handleQualityChange = (q: SettingsState["video"]["videoQuality"]) => {
    onUpdate((prev) => ({
      ...prev,
      video: { ...prev.video, videoQuality: q },
    }));
    toast.success(`Video quality set to ${q.toUpperCase()}`);
  };

  const handleEffectChange = (effect: SettingsState["video"]["backgroundEffect"]) => {
    onUpdate((prev) => ({
      ...prev,
      video: { ...prev.video, backgroundEffect: effect },
    }));
    toast.success(`Background effect set to ${effect}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Video & Camera
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Preview your camera stream, adjust stream resolution, and apply real-time virtual backgrounds.
        </p>
      </div>

      {/* Live Video Preview Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Camera Preview</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Ensure good lighting for optical hand gesture tracking.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPreviewActive(!isPreviewActive)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
          >
            {isPreviewActive ? "Pause Preview" : "Resume Preview"}
          </button>
        </div>

        {/* Viewport mockup */}
        <div className="relative aspect-video max-w-xl mx-auto rounded-2xl bg-stone-950 overflow-hidden flex items-center justify-center border border-stone-800 shadow-inner">
          {isPreviewActive ? (
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition-all ${
                settings.video.mirrorCamera ? "scale-x-[-1]" : ""
              } ${settings.video.backgroundEffect === "blur" ? "backdrop-blur-md" : ""}`}
            >
              {/* Animated avatar / camera feed placeholder */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 text-white flex items-center justify-center font-bold text-3xl shadow-xl ring-4 ring-white/10 mb-3 animate-pulse">
                SS
              </div>
              <p className="text-xs text-stone-400 font-mono">Camera active • {settings.video.videoQuality}</p>
            </div>
          ) : (
            <p className="text-xs text-stone-500">Camera preview paused</p>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 backdrop-blur-md text-emerald-400 border border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Feed
            </span>
          </div>
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-stone-300 bg-black/60 backdrop-blur-md">
              {settings.video.backgroundEffect !== "none" ? `Effect: ${settings.video.backgroundEffect}` : "Standard"}
            </span>
          </div>
        </div>

        {/* Camera device selection */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Camera Source</label>
          <select
            value={settings.video.camera}
            onChange={(e) => {
              onUpdate((prev) => ({
                ...prev,
                video: { ...prev.video, camera: e.target.value },
              }));
              toast.success("Camera updated");
            }}
            className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">FaceTime HD Camera (Built-in)</option>
            <option value="external-usb">Logitech Brio 4K / USB Webcam</option>
            <option value="obs-cam">OBS Virtual Camera</option>
          </select>
        </div>
      </div>

      {/* Video Quality & Mirror */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Video Resolution & Quality</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Select streaming resolution to match your network bandwidth.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(["auto", "360p", "720p", "1080p"] as const).map((q) => {
            const isSelected = settings.video.videoQuality === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => handleQualityChange(q)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                }`}
              >
                <span className="uppercase text-xs font-mono">{q}</span>
              </button>
            );
          })}
        </div>

        {/* Mirror Camera Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-stone-700 dark:text-stone-300">
              <FlipHorizontal className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Mirror My Video</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Flips your camera horizontally so gesturing feels natural like a mirror.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdate((prev) => {
                const nextVal = !prev.video.mirrorCamera;
                toast.success(`Camera mirror ${nextVal ? "enabled" : "disabled"}`);
                return { ...prev, video: { ...prev.video, mirrorCamera: nextVal } };
              });
            }}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.video.mirrorCamera ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.video.mirrorCamera ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Background Effects */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Background Effects</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Apply neural segmentation blur or virtual background.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "none", name: "None", desc: "Original room" },
            { id: "blur", name: "Slight Blur", desc: "Privacy backdrop" },
            { id: "studio", name: "Studio", desc: "Warm modern office" },
            { id: "nature", name: "Nature", desc: "Calm outdoor view" },
          ].map((effect) => {
            const isSelected = settings.video.backgroundEffect === effect.id;
            return (
              <button
                key={effect.id}
                type="button"
                onClick={() => handleEffectChange(effect.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">{effect.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[3]" />}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{effect.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
