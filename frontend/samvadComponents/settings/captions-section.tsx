"use client";

import React from "react";
import { Subtitles, Languages, Sparkles, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface CaptionsSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
];

export function CaptionsSection({ settings, onUpdate }: CaptionsSectionProps) {
  const handleSizeChange = (size: SettingsState["captionsTranslation"]["captionSize"]) => {
    onUpdate((prev) => ({
      ...prev,
      captionsTranslation: { ...prev.captionsTranslation, captionSize: size },
    }));
    toast.success(`Caption size set to ${size}`);
  };

  const handleLangChange = (code: string) => {
    onUpdate((prev) => ({
      ...prev,
      captionsTranslation: { ...prev.captionsTranslation, translationLanguage: code },
    }));
    const found = LANGUAGES.find((l) => l.code === code);
    toast.success(`Translation language set to ${found?.name || code}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Captions & Translation
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Configure real-time automated subtitles, font sizing, and multilingual speech/gesture translation.
        </p>
      </div>

      {/* Enable Captions Master Toggle */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <Subtitles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Live Captions</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Transcribe voice and sign language gestures directly on screen.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onUpdate((prev) => {
              const nextVal = !prev.captionsTranslation.enableCaptions;
              toast.success(`Captions ${nextVal ? "enabled" : "disabled"}`);
              return {
                ...prev,
                captionsTranslation: { ...prev.captionsTranslation, enableCaptions: nextVal },
              };
            });
          }}
          className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
            settings.captionsTranslation.enableCaptions ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
          }`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
              settings.captionsTranslation.enableCaptions ? "right-1" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Caption Size */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Subtitle Font Size</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Choose the display size for closed captions during meetings.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(["small", "medium", "large", "huge"] as const).map((size) => {
            const isSelected = settings.captionsTranslation.captionSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeChange(size)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                }`}
              >
                <span className="capitalize text-xs sm:text-sm">{size}</span>
              </button>
            );
          })}
        </div>

        {/* Live caption preview box */}
        <div className="p-4 rounded-2xl bg-stone-900 text-white border border-stone-800 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">Preview Box</p>
          <p
            className={`text-stone-100 font-medium ${
              settings.captionsTranslation.captionSize === "small"
                ? "text-xs"
                : settings.captionsTranslation.captionSize === "medium"
                ? "text-sm"
                : settings.captionsTranslation.captionSize === "large"
                ? "text-base"
                : "text-lg font-semibold"
            }`}
          >
            [Aarav]: "Hello everyone, welcome to Samvad accessible conference!"
          </p>
        </div>
      </div>

      {/* Translation Language & Auto-translate */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Translation Target Language</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Incoming speech or signs will be automatically translated to this language.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {LANGUAGES.map((lang) => {
            const isSelected = settings.captionsTranslation.translationLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLangChange(lang.code)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                }`}
              >
                <span className="text-xs sm:text-sm">{lang.name}</span>
                {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>

        {/* Auto-Translate Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Auto-Translate Subtitles</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Real-time neural translation between Indian regional languages and English.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdate((prev) => {
                const nextVal = !prev.captionsTranslation.autoTranslate;
                toast.success(`Auto-translate ${nextVal ? "enabled" : "disabled"}`);
                return {
                  ...prev,
                  captionsTranslation: { ...prev.captionsTranslation, autoTranslate: nextVal },
                };
              });
            }}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.captionsTranslation.autoTranslate ? "bg-purple-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.captionsTranslation.autoTranslate ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
