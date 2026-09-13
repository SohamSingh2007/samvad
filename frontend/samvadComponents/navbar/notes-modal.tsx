"use client";

import React, { useState } from "react";
import { Mic, Sparkles, X, Check, Volume2, Hand, Subtitles } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";

export function InPersonNotesButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState<string[]>([
    "Real-time speech-to-text is ready.",
    "Indian Sign Language (ISL) gesture recognition is active.",
  ]);

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast.info("Notes recording started", {
        description: "Capturing in-person conversation and sign gestures...",
        action: { label: "Got It!" },
      });
      setTimeout(() => {
        setNotes((prev) => [...prev, "Participant: 'Welcome everyone to today's meeting.'"]);
      }, 1500);
    } else {
      setIsRecording(false);
      toast.success("Notes saved", {
        description: "In-person transcription saved to meeting scratchpad.",
      });
    }
  };

  return (
    <>
      {/* Pastel Sky-Blue Capsule Button matching Google Meet */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 h-[42px] px-3.5 sm:px-4 rounded-full text-xs sm:text-sm font-medium bg-[#c2e7ff] hover:bg-[#b0deff] active:bg-[#9fd7ff] text-[#001d35] dark:bg-[#0c3d63] dark:hover:bg-[#124d7c] dark:text-[#c2e7ff] transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap select-none"
      >
        <div className="relative flex items-center justify-center">
          <Mic className="w-4 h-4 text-[#001d35] dark:text-[#c2e7ff] stroke-[2.2]" />
          <Sparkles className="w-2.5 h-2.5 text-[#001d35] dark:text-[#c2e7ff] absolute -top-1 -right-1" />
        </div>
        <span>In-person notes</span>
      </button>

      {/* Interactive Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#c2e7ff] dark:bg-[#0c3d63] flex items-center justify-center text-[#001d35] dark:text-[#c2e7ff]">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">In-person notes</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">AI audio & sign language transcription</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/80 space-y-3 min-h-[160px] max-h-[240px] overflow-y-auto">
              <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-rose-500 animate-pulse" : "bg-stone-400"}`} />
                <span>{isRecording ? "Listening & transcribing in real-time..." : "Click start to record meeting notes"}</span>
              </div>
              <div className="space-y-2 text-xs text-stone-800 dark:text-stone-200">
                {notes.map((note, index) => (
                  <div key={index} className="p-2 rounded-lg bg-white dark:bg-stone-900/80 border border-stone-200/50 dark:border-stone-700/50">
                    {note}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                  isRecording
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-[#001d35] text-white dark:bg-white dark:text-[#001d35] hover:opacity-90"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isRecording ? "Stop Recording" : "Start Live Notes"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
