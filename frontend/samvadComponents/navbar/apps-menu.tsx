"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Video, Hand, Subtitles, Volume2, ShieldCheck, LayoutDashboard } from "lucide-react";

export function AppsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const apps = [
    { title: "Meetings", desc: "Video conferencing", icon: Video, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400", href: "/dashboard" },
    { title: "ISL AI", desc: "Sign recognition", icon: Hand, color: "text-orange-600 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-400", href: "/dashboard" },
    { title: "Captions", desc: "Live STT translation", icon: Subtitles, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400", href: "/dashboard" },
    { title: "Voice TTS", desc: "Text-to-speech engine", icon: Volume2, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-400", href: "/dashboard" },
    { title: "Workspace", desc: "Dashboard overview", icon: LayoutDashboard, color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400", href: "/dashboard" },
    { title: "Security", desc: "Private encryption", icon: ShieldCheck, color: "text-stone-700 bg-stone-100 dark:bg-stone-800 dark:text-stone-300", href: "/dashboard" },
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* 9 Dots Grid Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Google / Samvad apps"
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <circle cx="6" cy="6" r="2" />
          <circle cx="12" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="12" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      </button>

      {/* Grid Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 px-1">
            Samvad Services
          </p>
          <div className="grid grid-cols-3 gap-2">
            {apps.map((app, i) => (
              <Link
                key={i}
                href={app.href}
                onClick={() => setIsOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800/70 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-1.5 ${app.color} group-hover:scale-105 transition-transform`}>
                  <app.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-stone-800 dark:text-stone-200 text-center leading-tight truncate w-full">
                  {app.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
