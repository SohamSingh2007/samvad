"use client";

import React from "react";
import { Hand, Sliders, Camera, Target, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface SignLanguageSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function SignLanguageSection({ settings, onUpdate }: SignLanguageSectionProps) {
  const handleLangChange = (lang: SettingsState["signLanguage"]["language"]) => {
    onUpdate((prev) => ({
      ...prev,
      signLanguage: { ...prev.signLanguage, language: lang },
    }));
    toast.success(`Sign Language set to ${lang.toUpperCase()}`);
  };

  const handleSensitivityChange = (val: number) => {
    onUpdate((prev) => ({
      ...prev,
      signLanguage: { ...prev.signLanguage, detectionSensitivity: val },
    }));
  };

  const handleConfidenceChange = (val: number) => {
    onUpdate((prev) => ({
      ...prev,
      signLanguage: { ...prev.signLanguage, predictionConfidence: val },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Sign Language (ISL) Engine
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Tune real-time gesture recognition, camera tracking responsiveness, and neural model confidence.
        </p>
      </div>

      {/* Language Engine Choice */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Hand className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Sign Language Standard</h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Select the sign language grammar and vocabulary dictionary to use for translations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "isl", name: "Indian Sign Language (ISL)", tag: "Recommended", desc: "Dual-hand grammar with regional Indian dialects" },
            { id: "asl", name: "American Sign Language (ASL)", tag: "Standard", desc: "North American signs with fingerspelling" },
            { id: "bsl", name: "British Sign Language (BSL)", tag: "Standard", desc: "Two-handed manual alphabet vocabulary" },
          ].map((item) => {
            const isSelected = settings.signLanguage.language === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLangChange(item.id as any)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">{item.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 stroke-[2.5]" />}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">{item.desc}</p>
                </div>
                <span className="mt-3 inline-block text-[10px] font-semibold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded-full w-fit">
                  {item.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Selection for ISL */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-stone-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">ISL Tracking Camera</h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Dedicated camera device used for optical hand landmark estimation.
        </p>

        <select
          value={settings.signLanguage.cameraDevice}
          onChange={(e) => {
            onUpdate((prev) => ({
              ...prev,
              signLanguage: { ...prev.signLanguage, cameraDevice: e.target.value },
            }));
            toast.success("Camera input selected");
          }}
          className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
        >
          <option value="default">FaceTime HD Camera (Built-in)</option>
          <option value="usb-webcam">External USB HD Wide-Angle Camera</option>
          <option value="obs-virtual">OBS Virtual Camera</option>
        </select>
      </div>

      {/* Sensitivity & Confidence Sliders */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        {/* Detection Sensitivity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-stone-500" />
              <label className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Detection Sensitivity
              </label>
            </div>
            <span className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800">
              {settings.signLanguage.detectionSensitivity}%
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Higher values detect rapid finger movements; lower values reduce camera jitter.
          </p>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={settings.signLanguage.detectionSensitivity}
            onChange={(e) => handleSensitivityChange(Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-stone-400 font-mono">
            <span>Low (20%)</span>
            <span>Balanced (80%)</span>
            <span>Fast / Dynamic (100%)</span>
          </div>
        </div>

        {/* Prediction Confidence */}
        <div className="space-y-2 pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-stone-500" />
              <label className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Prediction Confidence Threshold
              </label>
            </div>
            <span className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800">
              {settings.signLanguage.predictionConfidence}%
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Minimum neural network probability before a sign is translated into spoken text.
          </p>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={settings.signLanguage.predictionConfidence}
            onChange={(e) => handleConfidenceChange(Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-stone-400 font-mono">
            <span>Permissive (50%)</span>
            <span>Balanced (85%)</span>
            <span>Strict (95%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
