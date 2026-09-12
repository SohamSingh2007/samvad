"use client";

import React, { useState } from "react";
import { HelpCircle, X, BookOpen, MessageSquare, Keyboard, Shield } from "lucide-react";

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  const helpTopics = [
    { title: "Keyboard shortcuts", desc: "Mute, toggle camera, raise hand", icon: Keyboard },
    { title: "Sign Language Setup", desc: "Best camera angle and lighting for ISL", icon: BookOpen },
    { title: "Feedback & Report", desc: "Report issues or suggest accessibility improvements", icon: MessageSquare },
    { title: "Privacy & Encryption", desc: "How your video and gesture streams are secured", icon: Shield },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Help & support"
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Help & Support</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {helpTopics.map((topic, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 flex items-start gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-stone-600 dark:text-stone-300">
                    <topic.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">{topic.title}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{topic.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
