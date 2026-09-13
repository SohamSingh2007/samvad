"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Home,
  BarChart3,
  MessageSquareMore,
  BookOpen,
  Radio,
  FileText,
  MessageSquare,
  Moon,
  Sun,
  ArrowRight,
  ExternalLink,
  Command,
} from "lucide-react";
import { useTheme } from "next-themes";
import { AdminTabId } from "./types";

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AdminTabId) => void;
}

export function AdminCommandPalette({
  isOpen,
  onClose,
  onSelectTab,
}: AdminCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via custom event or props
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items: {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    category: "Navigation" | "Templates" | "Actions";
    action: () => void;
  }[] = [
    {
      id: "tab-dashboard",
      title: "Dashboard",
      subtitle: "Overview, live meetings & system health",
      icon: Home,
      category: "Navigation",
      action: () => {
        onSelectTab("dashboard");
        onClose();
      },
    },
    {
      id: "tab-performance",
      title: "Performance",
      subtitle: "WebRTC latency, ISL model inference, STT metrics",
      icon: BarChart3,
      category: "Navigation",
      action: () => {
        onSelectTab("performance");
        onClose();
      },
    },
    {
      id: "tab-conversations",
      title: "Conversations",
      subtitle: "Meeting logs, transcripts & detected sign tokens",
      icon: MessageSquareMore,
      category: "Navigation",
      action: () => {
        onSelectTab("conversations");
        onClose();
      },
    },
    {
      id: "tab-guides",
      title: "Guides & Documentation",
      subtitle: "Setup, ISL calibration, WebRTC configuration",
      icon: BookOpen,
      category: "Navigation",
      action: () => {
        onSelectTab("guides");
        onClose();
      },
    },
    {
      id: "tab-hotspots",
      title: "Hotspots",
      subtitle: "Regional usage heatmaps and peak meeting hours",
      icon: Radio,
      category: "Navigation",
      action: () => {
        onSelectTab("hotspots");
        onClose();
      },
    },
    {
      id: "tab-templates",
      title: "Templates (10)",
      subtitle: "Browse 10 pre-configured meeting blueprints",
      icon: FileText,
      category: "Navigation",
      action: () => {
        onSelectTab("templates");
        onClose();
      },
    },
    {
      id: "tab-feedback",
      title: "Feedback",
      subtitle: "User satisfaction ratings and bug reports",
      icon: MessageSquare,
      category: "Navigation",
      action: () => {
        onSelectTab("feedback");
        onClose();
      },
    },
    {
      id: "act-theme",
      title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
      subtitle: "Toggle visual color theme",
      icon: theme === "dark" ? Sun : Moon,
      category: "Actions",
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        onClose();
      },
    },
    {
      id: "act-dashboard",
      title: "Go to Main User Dashboard",
      subtitle: "Return to meeting client (/dashboard)",
      icon: ExternalLink,
      category: "Actions",
      action: () => {
        window.location.href = "/dashboard";
      },
    },
  ];

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-[#1c1b1a] rounded-2xl shadow-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-stone-200/80 dark:border-stone-800/80 gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
            ESC to close
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-400">
              No matching commands or pages found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-700 dark:group-hover:text-stone-200 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <Command className="w-3 h-3" /> Samvad Admin Spotlight
          </span>
          <span>Press ↵ to select</span>
        </div>
      </div>
    </div>
  );
}
