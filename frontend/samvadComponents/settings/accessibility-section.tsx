"use client";

import React from "react";
import { Type, Eye, Sparkles, Subtitles, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface AccessibilitySectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function AccessibilitySection({ settings, onUpdate }: AccessibilitySectionProps) {
  const handleFontSizeChange = (size: SettingsState["accessibility"]["fontSize"]) => {
    onUpdate((prev) => ({
      ...prev,
      accessibility: { ...prev.accessibility, fontSize: size },
    }));
    toast.success(`Font size set to ${size}`);
  };

  const handleToggle = (key: keyof SettingsState["accessibility"], label: string) => {
    onUpdate((prev) => {
      const nextVal = !prev.accessibility[key];
      toast.success(`${label} ${nextVal ? "enabled" : "disabled"}`);
      return {
        ...prev,
        accessibility: { ...prev.accessibility, [key]: nextVal },
      };
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Accessibility
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Essential visual and cognitive accommodations for comfortable, inclusive communication.
        </p>
      </div>

      {/* Font Size Scaling */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-stone-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Interface Font Size</h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Scale meeting transcriptions, chat messages, and UI text elements.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(["small", "medium", "large", "x-large"] as const).map((size) => {
            const isSelected = settings.accessibility.fontSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleFontSizeChange(size)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-stone-900 dark:border-white bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-semibold shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                }`}
              >
                <span className="capitalize text-xs sm:text-sm">{size.replace("-", " ")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5 divide-y divide-stone-100 dark:divide-stone-800">
        {/* High Contrast */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">High Contrast Mode</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Strengthen borders, icons, and contrast ratios for visual acuity.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("highContrast", "High contrast")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.accessibility.highContrast ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.accessibility.highContrast ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Reduce Animations */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Reduce Motion & Animations</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Diminish non-essential zoom, pan, and slide transitions.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("reduceAnimations", "Reduced motion")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.accessibility.reduceAnimations ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.accessibility.reduceAnimations ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Captions by Default */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Subtitles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Always Enable Captions</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Automatically display live speech and gesture subtitles when entering calls.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("captionsEnabled", "Default captions")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.accessibility.captionsEnabled ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.accessibility.captionsEnabled ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
