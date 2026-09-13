"use client";

import React, { useState } from "react";
import {
  User,
  Palette,
  Eye,
  Hand,
  Mic,
  Video,
  Languages,
  Calendar,
  Bell,
  Shield,
  Database,
  Info,
  Search,
  ChevronRight,
} from "lucide-react";
import { SettingsSectionId } from "./types";

interface SectionDef {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SETTINGS_SECTIONS: SectionDef[] = [
  { id: "account", label: "Account", description: "Profile, email, password", icon: User },
  { id: "appearance", label: "Appearance", description: "Theme & accent colors", icon: Palette },
  { id: "accessibility", label: "Accessibility", description: "Font scaling, contrast, motion", icon: Eye },
  { id: "sign-language", label: "Sign Language", description: "ISL engine, sensitivity, confidence", icon: Hand },
  { id: "audio-speech", label: "Audio & Speech", description: "Mic, speaker, TTS voice, speed", icon: Mic },
  { id: "video", label: "Video", description: "Camera, quality, mirror, blur", icon: Video },
  { id: "captions", label: "Captions & Translation", description: "Live STT, translation language", icon: Languages },
  { id: "meeting", label: "Meeting", description: "Default mic/cam, join behaviors", icon: Calendar },
  { id: "notifications", label: "Notifications", description: "Invites, reminders, chat alerts", icon: Bell },
  { id: "privacy-security", label: "Privacy & Security", description: "Active sessions, 2FA, E2EE", icon: Shield },
  { id: "data", label: "Data", description: "Meeting history, recordings, export", icon: Database },
  { id: "about", label: "About", description: "Version, help, legal policies", icon: Info },
];

interface SettingsSidebarProps {
  activeSection: SettingsSectionId;
  onSelectSection: (id: SettingsSectionId) => void;
}

export function SettingsSidebar({ activeSection, onSelectSection }: SettingsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = SETTINGS_SECTIONS.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-full flex flex-col space-y-3 select-none">
      {/* Quick Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search settings..."
          className="w-full pl-9 pr-3 py-2 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-transparent focus:border-stone-300 dark:focus:border-stone-700 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none transition-all"
        />
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col gap-1">
        {filteredSections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer select-none group ${
                isActive
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-white/15 dark:bg-stone-950/15 text-white dark:text-stone-950"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="leading-tight font-medium truncate">{sec.label}</p>
                  <p
                    className={`text-[11px] mt-0.5 leading-tight truncate ${
                      isActive ? "text-white/75 dark:text-stone-950/75" : "text-stone-400 dark:text-stone-500"
                    }`}
                  >
                    {sec.description}
                  </p>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ml-1 ${
                  isActive ? "text-white dark:text-stone-950 translate-x-0.5" : "text-transparent"
                }`}
              />
            </button>
          );
        })}

        {filteredSections.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-6">No matching settings found</p>
        )}
      </nav>
    </aside>
  );
}
