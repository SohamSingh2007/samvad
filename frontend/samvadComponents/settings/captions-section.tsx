"use client";

import React from "react";
import { Subtitles, Languages, Sparkles, Check, Globe, ChevronDown } from "lucide-react";
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
  const handleLangChange = (code: string) => {
    onUpdate((prev) => ({
      ...prev,
      captionsTranslation: { ...prev.captionsTranslation, translationLanguage: code },
    }));
    const found = LANGUAGES.find((l) => l.code === code);
    toast.success(`Language set to ${found?.name || code}`);
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

      {/* Google Meet Captions Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        {/* Language of the meeting - Outlined Fieldset */}
        <fieldset className="relative border border-stone-300 dark:border-stone-600/80 rounded-xl px-4 pt-1.5 pb-2.5 bg-stone-50/50 dark:bg-stone-900/60 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
          <legend className="text-[11px] font-medium text-stone-500 dark:text-stone-400 px-2 ml-1">
            Language of the meeting
          </legend>
          <div className="relative flex items-center gap-3">
            <Globe className="w-4 h-4 text-stone-500 dark:text-stone-300 shrink-0" />
            <select
              value={settings.captionsTranslation.translationLanguage}
              onChange={(e) => handleLangChange(e.target.value)}
              className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden cursor-pointer py-1 appearance-none pr-8 font-medium"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                  {l.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
          </div>
        </fieldset>

        {/* Live Captions Toggle Switch Row */}
        <div className="py-2 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label
              onClick={() => {
                onUpdate((prev) => {
                  const next = !prev.captionsTranslation.enableCaptions;
                  toast.info(next ? "Live Captions Enabled" : "Live Captions Disabled");
                  return {
                    ...prev,
                    captionsTranslation: { ...prev.captionsTranslation, enableCaptions: next },
                  };
                });
              }}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer select-none"
            >
              Live captions
            </label>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm">
              Shows you captions for speech in the language of the meeting.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.captionsTranslation.enableCaptions}
            onClick={() => {
              onUpdate((prev) => {
                const next = !prev.captionsTranslation.enableCaptions;
                toast.info(next ? "Live Captions Enabled" : "Live Captions Disabled");
                return {
                  ...prev,
                  captionsTranslation: { ...prev.captionsTranslation, enableCaptions: next },
                };
              });
            }}
            className={`w-11 h-6 rounded-lg p-0.5 transition-all duration-200 ease-in-out cursor-pointer shrink-0 relative flex items-center border shadow-xs ${
              settings.captionsTranslation.enableCaptions
                ? "bg-blue-600 border-blue-500 shadow-blue-500/20"
                : "bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 hover:bg-stone-300 dark:hover:bg-stone-750"
            }`}
          >
            <span
              className={`inline-block w-4.5 h-4.5 rounded-md bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                settings.captionsTranslation.enableCaptions ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* CUSTOMISE YOUR CAPTIONS */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-4">
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-stone-800 dark:text-stone-200">
              CUSTOMISE YOUR CAPTIONS
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Choose your preferred settings to set how captions will appear during your calls
            </p>
          </div>

          {/* 2x2 Customization Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Font size */}
            <fieldset className="relative border border-stone-300 dark:border-stone-600/80 rounded-xl px-3.5 pt-1.5 pb-2 bg-stone-50/50 dark:bg-stone-900/60 focus-within:border-blue-500 transition-all">
              <legend className="text-[11px] font-medium text-stone-500 dark:text-stone-400 px-1.5 ml-1">
                Font size
              </legend>
              <div className="relative flex items-center">
                <select
                  value={settings.captionsTranslation.captionSize || "medium"}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      captionsTranslation: {
                        ...prev.captionsTranslation,
                        captionSize: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden cursor-pointer py-1 appearance-none pr-8 capitalize font-medium"
                >
                  <option value="tiny" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Tiny</option>
                  <option value="small" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Small</option>
                  <option value="medium" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Default</option>
                  <option value="large" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Large</option>
                  <option value="huge" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Huge</option>
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
              </div>
            </fieldset>

            {/* Font */}
            <fieldset className="relative border border-stone-300 dark:border-stone-600/80 rounded-xl px-3.5 pt-1.5 pb-2 bg-stone-50/50 dark:bg-stone-900/60 focus-within:border-blue-500 transition-all">
              <legend className="text-[11px] font-medium text-stone-500 dark:text-stone-400 px-1.5 ml-1">
                Font
              </legend>
              <div className="relative flex items-center">
                <select
                  value={settings.captionsTranslation.fontFamily || "default"}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      captionsTranslation: {
                        ...prev.captionsTranslation,
                        fontFamily: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden cursor-pointer py-1 appearance-none pr-8 capitalize font-medium"
                >
                  <option value="default" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Default</option>
                  <option value="sans-serif" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Sans-serif</option>
                  <option value="serif" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Serif</option>
                  <option value="monospace" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Monospace</option>
                  <option value="casual" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Casual</option>
                  <option value="cursive" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Cursive</option>
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
              </div>
            </fieldset>

            {/* Font colour */}
            <fieldset className="relative border border-stone-300 dark:border-stone-600/80 rounded-xl px-3.5 pt-1.5 pb-2 bg-stone-50/50 dark:bg-stone-900/60 focus-within:border-blue-500 transition-all">
              <legend className="text-[11px] font-medium text-stone-500 dark:text-stone-400 px-1.5 ml-1">
                Font colour
              </legend>
              <div className="relative flex items-center">
                <select
                  value={settings.captionsTranslation.fontColor || "default"}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      captionsTranslation: {
                        ...prev.captionsTranslation,
                        fontColor: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden cursor-pointer py-1 appearance-none pr-8 capitalize font-medium"
                >
                  <option value="default" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Default</option>
                  <option value="white" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">White</option>
                  <option value="yellow" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Yellow</option>
                  <option value="cyan" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Cyan</option>
                  <option value="green" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Green</option>
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
              </div>
            </fieldset>

            {/* Background colour */}
            <fieldset className="relative border border-stone-300 dark:border-stone-600/80 rounded-xl px-3.5 pt-1.5 pb-2 bg-stone-50/50 dark:bg-stone-900/60 focus-within:border-blue-500 transition-all">
              <legend className="text-[11px] font-medium text-stone-500 dark:text-stone-400 px-1.5 ml-1">
                Background colour
              </legend>
              <div className="relative flex items-center">
                <select
                  value={settings.captionsTranslation.backgroundColor || "default"}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      captionsTranslation: {
                        ...prev.captionsTranslation,
                        backgroundColor: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden cursor-pointer py-1 appearance-none pr-8 capitalize font-medium"
                >
                  <option value="default" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Default</option>
                  <option value="black" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Black</option>
                  <option value="dark-gray" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Dark Gray</option>
                  <option value="blue" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Blue</option>
                  <option value="transparent" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Transparent</option>
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
              </div>
            </fieldset>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                onUpdate((prev) => ({
                  ...prev,
                  captionsTranslation: {
                    ...prev.captionsTranslation,
                    captionSize: "medium",
                    fontFamily: "default",
                    fontColor: "default",
                    backgroundColor: "default",
                  },
                }));
                toast.info("Captions settings reset to default");
              }}
              className="px-5 py-2 rounded-xl bg-[#c2e7ff] hover:bg-[#b3d7ef] text-[#001d35] font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Reset
            </button>
          </div>
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
