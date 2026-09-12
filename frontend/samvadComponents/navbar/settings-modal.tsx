"use client";

import React, { useState } from "react";
import { Settings, X, Mic, Video, Hand, Subtitles, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [islModel, setIslModel] = useState("high-accuracy");
  const [captionsSize, setCaptionsSize] = useState("medium");
  const [audioNoiseCancellation, setAudioNoiseCancellation] = useState(true);

  const handleSave = () => {
    setIsOpen(false);
    toast.success("Settings saved", {
      description: "Audio, camera, and ISL recognition preferences updated.",
      action: { label: "Got It!" },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Settings"
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Meeting Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* ISL Model Selection */}
              <div className="space-y-2">
                <label className="font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Hand className="w-4 h-4 text-orange-500" />
                  Sign Language (ISL) Engine
                </label>
                <select
                  value={islModel}
                  onChange={(e) => setIslModel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="high-accuracy">High Accuracy (Dual-Hand Mediapipe)</option>
                  <option value="low-latency">Low Latency (Fast Gesture Stream)</option>
                  <option value="balanced">Balanced Mode</option>
                </select>
              </div>

              {/* Caption Size */}
              <div className="space-y-2">
                <label className="font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Subtitles className="w-4 h-4 text-blue-500" />
                  Live Caption Font Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["small", "medium", "large"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCaptionsSize(size)}
                      className={`p-2 rounded-xl text-xs font-medium border transition-colors capitalize ${
                        captionsSize === size
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold"
                          : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Noise Cancellation */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-stone-500" />
                  <div>
                    <p className="font-medium text-stone-800 dark:text-stone-200 text-xs sm:text-sm">Noise Cancellation</p>
                    <p className="text-[11px] text-stone-400">Filter background noise</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAudioNoiseCancellation(!audioNoiseCancellation)}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                    audioNoiseCancellation ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      audioNoiseCancellation ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
