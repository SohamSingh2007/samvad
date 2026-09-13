"use client";

import React, { useState } from "react";
import { Mic, Volume2, Gauge, Play, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface AudioSpeechSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function AudioSpeechSection({ settings, onUpdate }: AudioSpeechSectionProps) {
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleTestSpeaker = () => {
    setIsPlayingTest(true);
    toast.info("Testing audio output...", {
      description: "Playing sample test chime.",
      duration: 2000,
    });
    setTimeout(() => setIsPlayingTest(false), 1500);
  };

  const handleTestVoice = () => {
    toast.success("Playing sample TTS voice", {
      description: `Testing voice: ${settings.audioSpeech.ttsVoice} at ${settings.audioSpeech.speechSpeed}x speed.`,
      duration: 2500,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Audio & Speech
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Configure hardware microphones, playback speakers, and text-to-speech voice synthesizer.
        </p>
      </div>

      {/* Hardware Devices */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Input & Output Devices</h3>

        {/* Microphone */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-2">
            <Mic className="w-4 h-4 text-stone-500" />
            Microphone Device
          </label>
          <select
            value={settings.audioSpeech.microphone}
            onChange={(e) => {
              onUpdate((prev) => ({
                ...prev,
                audioSpeech: { ...prev.audioSpeech, microphone: e.target.value },
              }));
              toast.success("Microphone updated");
            }}
            className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">MacBook Pro Microphone (Built-in)</option>
            <option value="airpods">AirPods Pro (Bluetooth)</option>
            <option value="usb-mic">Blue Yeti USB Microphone</option>
          </select>
          {/* Simulated audio meter */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-stone-400">Input Level:</span>
            <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden flex gap-0.5">
              <div className="w-1/3 bg-emerald-500 rounded-full animate-pulse" />
              <div className="w-1/4 bg-emerald-500/80 rounded-full" />
              <div className="w-1/6 bg-amber-500/40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Speaker */}
        <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-stone-500" />
              Speaker Device
            </label>
            <button
              type="button"
              onClick={handleTestSpeaker}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Play className={`w-3 h-3 ${isPlayingTest ? "animate-spin" : ""}`} />
              {isPlayingTest ? "Testing..." : "Test speaker"}
            </button>
          </div>
          <select
            value={settings.audioSpeech.speaker}
            onChange={(e) => {
              onUpdate((prev) => ({
                ...prev,
                audioSpeech: { ...prev.audioSpeech, speaker: e.target.value },
              }));
              toast.success("Speaker updated");
            }}
            className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">MacBook Pro Speakers (Built-in)</option>
            <option value="airpods">AirPods Pro (Spatial Audio)</option>
            <option value="hdmi">External Monitor / TV</option>
          </select>
        </div>
      </div>

      {/* Speech Synthesizer (TTS) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Text-to-Speech (TTS) Voice</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Voice used to speak out ISL gestures or typed messages.</p>
          </div>
          <button
            type="button"
            onClick={handleTestVoice}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" /> Test Voice
          </button>
        </div>

        {/* Voice Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "natural-in", name: "Aarav (Indian English)", accent: "Natural / Clear" },
            { id: "natural-hi", name: "Ananya (Hindi + English)", accent: "Bilingual" },
            { id: "warm-en", name: "Oliver (Warm & Expressive)", accent: "Conversational" },
          ].map((voice) => {
            const isSelected = settings.audioSpeech.ttsVoice === voice.id;
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => {
                  onUpdate((prev) => ({
                    ...prev,
                    audioSpeech: { ...prev.audioSpeech, ttsVoice: voice.id },
                  }));
                  toast.success(`Voice set to ${voice.name}`);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">{voice.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">{voice.accent}</p>
              </button>
            );
          })}
        </div>

        {/* Speech Speed Slider */}
        <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-stone-500" />
              Speech Rate
            </label>
            <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300">
              {settings.audioSpeech.speechSpeed.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.5"
            step="0.05"
            value={settings.audioSpeech.speechSpeed}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdate((prev) => ({
                ...prev,
                audioSpeech: { ...prev.audioSpeech, speechSpeed: val },
              }));
            }}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-stone-400 font-mono">
            <span>Slow (0.75x)</span>
            <span>Normal (1.00x)</span>
            <span>Fast (1.50x)</span>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-stone-500" />
              Master Volume
            </label>
            <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300">
              {settings.audioSpeech.volume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={settings.audioSpeech.volume}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdate((prev) => ({
                ...prev,
                audioSpeech: { ...prev.audioSpeech, volume: val },
              }));
            }}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
