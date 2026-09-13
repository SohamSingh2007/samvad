"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface AppearanceSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

const ACCENT_COLORS = [
  { id: "blue", name: "Samvad Blue", bg: "bg-blue-600", border: "border-blue-600" },
  { id: "emerald", name: "Emerald Green", bg: "bg-emerald-600", border: "border-emerald-600" },
  { id: "amber", name: "Warm Amber", bg: "bg-amber-500", border: "border-amber-500" },
  { id: "rose", name: "Rose Crimson", bg: "bg-rose-500", border: "border-rose-500" },
  { id: "purple", name: "Deep Violet", bg: "bg-purple-600", border: "border-purple-600" },
  { id: "stone", name: "Minimal Stone", bg: "bg-stone-700", border: "border-stone-700" },
] as const;

export function AppearanceSection({ settings, onUpdate }: AppearanceSectionProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    onUpdate((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, theme: newTheme },
    }));
    toast.success(`Theme set to ${newTheme}`, {
      action: { label: "Got It!" },
    });
  };

  const handleAccentChange = (accent: SettingsState["appearance"]["accentColor"]) => {
    onUpdate((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, accentColor: accent },
    }));
    toast.success("Accent color updated", {
      description: `Accent palette set to ${accent}.`,
      action: { label: "Got It!" },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Appearance
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Customize your theme mode and visual accent color for meeting rooms and interface cards.
        </p>
      </div>

      {/* Theme Selection */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Theme Mode</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Choose between light, dark, or system matching.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light */}
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === "light"
                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-5 h-5 text-amber-500" />
              {theme === "light" && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">Light</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Crisp daytime contrast</p>
            </div>
          </button>

          {/* Dark */}
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === "dark"
                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-5 h-5 text-indigo-400" />
              {theme === "dark" && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">Dark</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Low-glare night palette</p>
            </div>
          </button>

          {/* System */}
          <button
            type="button"
            onClick={() => handleThemeChange("system")}
            className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === "system"
                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <Laptop className="w-5 h-5 text-stone-500" />
              {theme === "system" && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">System</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Sync with OS preferences</p>
            </div>
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Accent Color</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Highlight color applied to active buttons, badges, and sliders.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {ACCENT_COLORS.map((accent) => {
            const isSelected = settings.appearance.accentColor === accent.id;
            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => handleAccentChange(accent.id)}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800 shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${accent.bg} flex items-center justify-center text-white shadow-xs`}>
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate w-full text-center">
                  {accent.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
