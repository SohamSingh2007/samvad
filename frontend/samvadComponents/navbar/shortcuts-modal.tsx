"use client";

import React from "react";
import { Command, X, Mic, Video, Hand, Search, HelpCircle } from "lucide-react";

export interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "⌘ D", desc: "Mute or unmute microphone", icon: Mic },
    { key: "⌘ E", desc: "Turn camera on or off", icon: Video },
    { key: "⌘ K", desc: "Open Command Palette / Search", icon: Search },
    { key: "⌘ H", desc: "Raise or lower hand", icon: Hand },
    { key: "?", desc: "Open Help Center", icon: HelpCircle },
    { key: "Esc", desc: "Close dialog or menu", icon: null },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-200">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-stone-400">Quick meeting navigation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 py-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50 text-xs sm:text-sm"
            >
              <span className="text-stone-700 dark:text-stone-200 font-medium">
                {item.desc}
              </span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 font-mono text-xs shadow-xs font-semibold">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
