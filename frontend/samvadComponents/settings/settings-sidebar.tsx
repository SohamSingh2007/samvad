"use client";

import React from "react";
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
} from "lucide-react";
import Link from "next/link";
import { SettingsSectionId } from "./types";

export interface SectionDef {
  id: SettingsSectionId;
  label: string;
  shortLabel?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SECTION_TO_ROUTE: Record<SettingsSectionId, string> = {
  account: "accounts",
  "audio-speech": "audio",
  video: "video",
  captions: "captions",
  meeting: "meetings",
  "sign-language": "sign-lang",
  appearance: "appearance",
  accessibility: "access",
  notifications: "alerts",
  "privacy-security": "privacy",
  data: "data",
  about: "about",
};

export function resolveSectionFromRoute(slug?: string): SettingsSectionId {
  if (!slug) return "account";
  const normalized = slug.toLowerCase();
  if (normalized === "account" || normalized === "accounts") return "account";
  if (normalized === "appearance") return "appearance";
  if (normalized === "accessibility" || normalized === "access") return "accessibility";
  if (normalized === "sign-language" || normalized === "sign-lang" || normalized === "signlang") return "sign-language";
  if (normalized === "audio-speech" || normalized === "audio") return "audio-speech";
  if (normalized === "video") return "video";
  if (normalized === "captions" || normalized === "caption") return "captions";
  if (normalized === "meeting" || normalized === "meetings") return "meeting";
  if (normalized === "notifications" || normalized === "notification" || normalized === "alerts" || normalized === "alert") return "notifications";
  if (normalized === "privacy-security" || normalized === "privacy" || normalized === "security") return "privacy-security";
  if (normalized === "data") return "data";
  if (normalized === "about") return "about";
  return "account";
}

export const LEFT_COLUMN_SECTIONS: SectionDef[] = [
  { id: "account", label: "Account", shortLabel: "Account", description: "Profile, email, password", icon: User },
  { id: "audio-speech", label: "Audio & Speech", shortLabel: "Audio", description: "Mic, speaker, TTS voice, speed", icon: Mic },
  { id: "video", label: "Video", shortLabel: "Video", description: "Camera, quality, mirror, blur", icon: Video },
  { id: "captions", label: "Captions & Translation", shortLabel: "Captions", description: "Live STT, translation language", icon: Languages },
  { id: "meeting", label: "Meetings", shortLabel: "Meetings", description: "Access policy, default mic/cam, reminders", icon: Calendar },
  { id: "sign-language", label: "Sign Language", shortLabel: "Sign Lang", description: "ISL engine, sensitivity, confidence", icon: Hand },
];

export const RIGHT_COLUMN_SECTIONS: SectionDef[] = [
  { id: "appearance", label: "Appearance", shortLabel: "Appearance", description: "Theme & accent colors", icon: Palette },
  { id: "accessibility", label: "Accessibility", shortLabel: "Access", description: "Font scaling, contrast, motion", icon: Eye },
  { id: "notifications", label: "Notifications", shortLabel: "Alerts", description: "Invites, reminders, chat alerts", icon: Bell },
  { id: "privacy-security", label: "Privacy & Security", shortLabel: "Privacy", description: "Active sessions, 2FA, E2EE", icon: Shield },
  { id: "data", label: "Data", shortLabel: "Data", description: "Meeting history, recordings, export", icon: Database },
  { id: "about", label: "About", shortLabel: "About", description: "Version, help, legal policies", icon: Info },
];

export const SETTINGS_SECTIONS: SectionDef[] = [
  ...LEFT_COLUMN_SECTIONS,
  ...RIGHT_COLUMN_SECTIONS,
];

interface SettingsSidebarProps {
  activeSection: SettingsSectionId;
  onSelectSection?: (id: SettingsSectionId) => void;
  searchQuery?: string;
  column?: "left" | "right" | "all";
}

export function SettingsSidebar({
  activeSection,
  onSelectSection,
  searchQuery = "",
  column = "all",
}: SettingsSidebarProps) {
  const sectionsToDisplay =
    column === "left"
      ? LEFT_COLUMN_SECTIONS
      : column === "right"
      ? RIGHT_COLUMN_SECTIONS
      : SETTINGS_SECTIONS;

  const filteredSections = sectionsToDisplay.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.shortLabel && s.shortLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <nav
      className="flex flex-col items-center gap-5 sm:gap-6 w-full select-none"
      aria-label={`${column} settings navigation`}
    >
      {filteredSections.map((sec) => {
        const Icon = sec.icon;
        const isActive = activeSection === sec.id;
        const displayLabel = sec.shortLabel || sec.label;
        const routePath = `/settings/${SECTION_TO_ROUTE[sec.id] || sec.id}`;

        return (
          <Link
            key={sec.id}
            href={routePath}
            scroll={false}
            onClick={() => onSelectSection?.(sec.id)}
            title={`${sec.label}: ${sec.description}`}
            className="flex flex-col items-center gap-1 cursor-pointer group focus:outline-hidden w-full max-w-[76px]"
          >
            {/* Pill Container */}
            <div
              className={`w-14 h-8 sm:w-16 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                isActive
                  ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] shadow-xs"
                  : "bg-transparent text-[#444746] dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/80"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "stroke-[2.2]" : "stroke-[1.8] group-hover:scale-110"
                }`}
              />
            </div>

            {/* Label Underneath */}
            <span
              className={`text-xs tracking-tight transition-colors text-center max-w-[76px] truncate ${
                isActive
                  ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
                  : "font-medium text-[#444746] dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200"
              }`}
            >
              {displayLabel}
            </span>
          </Link>
        );
      })}

      {filteredSections.length === 0 && (
        <p className="text-[11px] text-stone-400 text-center py-4">No match</p>
      )}
    </nav>
  );
}
