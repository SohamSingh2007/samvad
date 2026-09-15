"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, Sliders, Search } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { SamvadNavbar } from "@/samvadComponents/navbar";
import { toast } from "@/samvadComponents/toastMessage";
import { AuthGuard } from "@/samvadComponents/auth";
import {
  SettingsSectionId,
  SettingsState,
  DEFAULT_SETTINGS,
  SettingsSidebar,
  SETTINGS_SECTIONS,
  AccountSection,
  AppearanceSection,
  AccessibilitySection,
  SignLanguageSection,
  AudioSpeechSection,
  VideoSection,
  CaptionsSection,
  MeetingSection,
  NotificationsSection,
  PrivacySecuritySection,
  DataSection,
  AboutSection,
} from "@/samvadComponents/settings";

const STORAGE_KEY = "samvad_user_settings_v1";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("account");
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load from localStorage or session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } else if (session?.user) {
        setSettings((prev) => ({
          ...prev,
          account: {
            name: session.user.name || prev.account.name,
            email: session.user.email || prev.account.email,
            image: session.user.image || prev.account.image,
          },
        }));
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, [session]);

  // Sync user profile when session loads
  useEffect(() => {
    if (session?.user) {
      setSettings((prev) => ({
        ...prev,
        account: {
          name: session.user.name || prev.account.name,
          email: session.user.email || prev.account.email,
          image: session.user.image || prev.account.image,
        },
      }));
    }
  }, [session?.user]);

  // Update handler
  const handleUpdate = (updater: (prev: SettingsState) => SettingsState) => {
    setSettings((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      setHasChanges(true);
      return next;
    });
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore
    }
    setHasChanges(false);
    toast.info("Settings reset", {
      description: "Restored all preferences to system defaults.",
      action: { label: "Got It!" },
    });
  };

  const currentSectionDef = SETTINGS_SECTIONS.find((s) => s.id === activeSection);

  return (
    <AuthGuard loadingMessage="Verifying settings access...">
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200 bg-dot-grid">
        {/* Top Navbar */}
        <SamvadNavbar user={session?.user} />

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-8 sm:pb-12 space-y-4 sm:space-y-5">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-stone-300 dark:text-stone-700">/</span>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Settings</span>
              {currentSectionDef && (
                <>
                  <span className="text-stone-300 dark:text-stone-700 font-normal">/</span>
                  <span className="text-stone-600 dark:text-stone-300 font-medium">
                    {currentSectionDef.label}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-56 md:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/80 focus:border-stone-300 dark:focus:border-stone-600 rounded-lg text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset all to defaults</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Section Tabs (< md screens) */}
        <div className="md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SETTINGS_SECTIONS.filter((sec) =>
              sec.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sec.description.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-xs"
                      : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Responsive Layout (CSS Grid strictly enforces side-by-side on md and up) */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] gap-8 items-start">
          {/* Left Sidebar (Desktop & Tablet, sticky) */}
          <div className="hidden md:block md:sticky md:top-20">
            <SettingsSidebar
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              searchQuery={searchQuery}
            />
          </div>

          {/* Right Active Content Panel */}
          <main className="w-full min-w-0 bg-transparent">
            {activeSection === "account" && (
              <AccountSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "appearance" && (
              <AppearanceSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "accessibility" && (
              <AccessibilitySection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "sign-language" && (
              <SignLanguageSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "audio-speech" && (
              <AudioSpeechSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "video" && (
              <VideoSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "captions" && (
              <CaptionsSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "meeting" && (
              <MeetingSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "notifications" && (
              <NotificationsSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "privacy-security" && (
              <PrivacySecuritySection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "data" && (
              <DataSection settings={settings} onUpdate={handleUpdate} />
            )}
            {activeSection === "about" && (
              <AboutSection />
            )}
          </main>
        </div>
      </div>
    </div>
  </AuthGuard>
);
}
